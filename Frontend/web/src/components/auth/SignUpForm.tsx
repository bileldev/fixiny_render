import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Spinner from "../form/Spinner";
import { toast, Toaster } from 'react-hot-toast';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  role: 'PARTICULIER' | 'CHEF_PARK';
  enterpriseId?: string;
  enterprise?: {
    enterpriseName: string;
    description: string;
  };
  newZone?: string;
  zones?: string[];
  agreeToTerms: boolean;
};

const ROLE_DISPLAY = {
  PARTICULIER: 'Particulier',
  CHEF_PARK: 'Chef Park',
};

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setshowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showEnterpriseFields, setShowEnterpriseFields] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'PARTICULIER', // Default role
    newZone: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Partial<FormData & { apiError: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const phoneRegex = /^\+216\d{8}$/;

  const [enterpriseSearch, setEnterpriseSearch] = useState('');
  const [enterpriseOptions, setEnterpriseOptions] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Add this effect to fetch enterprises when searching
  useEffect(() => {
    if (enterpriseSearch.trim() && showEnterpriseFields) {
      const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`api/enterprises/get-enterprises?search=${encodeURIComponent(enterpriseSearch)}`);
          const data = await response.json();
          setEnterpriseOptions(data);
        } catch (error) {
          console.error('Failed to fetch enterprises', error);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [enterpriseSearch, showEnterpriseFields]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData & { apiError: string }> = {};
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{10,}$/;

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!strongPasswordRegex.test(formData.password)) {
      newErrors.password = 'Password must contain: 10+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'A valid phone number starts with +216 followed by 8 digits';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }    

    if (!isChecked) {
      setErrors(prev => ({ ...prev, apiError: 'You must agree to the terms' }));
      return false;
    }

    // CHEF_PARK specific validation
    if (formData.role === 'CHEF_PARK') {
      if (!formData.enterpriseId && !formData.enterprise?.enterpriseName) {
        newErrors.apiError = 'Chef de Park requires enterprise information';
      } else if (formData.enterprise?.enterpriseName && !formData.enterprise.description) {
        newErrors.apiError = 'Enterprise description is required';
      }
      if (!formData.zones || formData.zones.length === 0) {
        newErrors.apiError = 'At least one zone must be specified';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phoneNumber,
          role: formData.role,
          ...(formData.role === 'CHEF_PARK' && {
            ...(formData.enterpriseId ? 
              {enterprise_id: formData.enterpriseId } 
              : 
              {enterprise: {
                enterprise_name: formData.enterprise?.enterpriseName, // Changed field name
                description: formData.enterprise?.description
              }
            }),
            zones: formData.zones || []
          })  
        }),
        credentials: 'include' // For cookies if needed
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Registration failed');
        throw new Error(data.error || data.details || '');        
      }

      if (data.message?.includes('Pending admin approval')) {        
        navigate('/signin');
        toast.success('Registration is a success');
      } else {
        navigate('/');
        toast.success('Registration is a success');
      }
    } catch (error) {
      setErrors({
        ...errors,
        apiError: error instanceof Error ? error.message : 'Registration failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('enterprise.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        enterprise: {
          ...prev.enterprise!,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div>
        <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            //background: '#363636',
            //color: '#fff',
          },
        }}
        />
      </div>
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Sign up with Google
              </button>
              <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign up with X
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            {errors.apiError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-100">
                {errors.apiError}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter your first name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={!!errors.firstName}                      
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter your last name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={!!errors.lastName}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!errors.password}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.password}
                    </p>
                  )}
                </div>
                {/* <!-- Confirm Password --> */}
                <div>
                  <Label>
                    Confirm Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!errors.confirmPassword}
                    />
                    <span
                      onClick={() => setshowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                {/* Phone Number Field */}
                <div>
                  <Label>
                    Phone Number <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="+21612345678"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const input = e.target.value;

                      // 1. Always enforce +216 prefix
                      if (!input.startsWith("+216")) {
                        setFormData(prev => ({
                          ...prev,
                          phoneNumber: "+216"
                        }));
                        return;
                      }

                      // 2. Extract only digits after +216
                      const digitsAfterPrefix = input
                        .slice(4) // Remove +216
                        .replace(/\D/g, ""); // Remove any non-digits

                      // 3. Limit to 8 digits and update
                      setFormData(prev => ({
                        ...prev,
                        phoneNumber: `+216${digitsAfterPrefix.slice(0, 8)}`
                      }));

                      // 4. Real-time validation (optional)
                      if (digitsAfterPrefix.length === 8) {
                        setErrors(prev => ({ ...prev, phoneNumber: "" }));
                      } else {
                        setErrors(prev => ({
                          ...prev,
                          phoneNumber: "Must have 8 digits after +216"
                        }));
                      }
                    }}
                    error={!!errors.phoneNumber}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
                {/* Role Selection */}
                <div>
                  <Label>Account Type <span className="text-error-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {Object.entries(ROLE_DISPLAY).map(([value, display]) => (
                      <div key={value} className="flex items-center">
                        <input
                          type="radio"
                          id={`role-${value}`}
                          name="role"
                          value={value}
                          checked={formData.role === value}
                          onChange={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              role: value as FormData['role'] 
                            }));
                            setShowEnterpriseFields(value === 'CHEF_PARK');
                          }}
                          className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                        />
                        <label htmlFor={`role-${value}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {display}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Conditional Enterprise Fields for CHEF_PARK */}
                {showEnterpriseFields && (
                  <>
                    <div className="mb-4">
                      <Label>Enterprise Information <span className="text-error-500">*</span></Label>
                      <div className="space-y-4">
                        {/* Existing Enterprise Option */}
                        <div className="p-3 border rounded-lg">
                          <label className="flex items-center font-medium">
                            <input
                              type="radio"
                              name="enterpriseOption"
                              value="existing"
                              className="mr-2"
                              checked={!formData.enterprise}
                              onChange={() => setFormData(prev => ({ 
                                ...prev, 
                                enterprise: undefined 
                              }))}
                            />
                            Select Existing Enterprise
                          </label>
                            
                          {!formData.enterprise && (
                            <div className="mt-2 relative">
                              <Input
                                placeholder="Search for enterprise..."
                                value={enterpriseSearch}
                                onChange={(e) => setEnterpriseSearch(e.target.value)}
                              />
                              {isSearching && <Spinner className="absolute right-3 top-3 size-5" />}

                              {enterpriseOptions.length > 0 && (
                                <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                                  {enterpriseOptions.map(enterprise => (
                                    <div
                                      key={enterprise.id}
                                      className={`p-2 hover:bg-gray-100 cursor-pointer ${
                                        formData.enterpriseId === enterprise.id ? 'bg-brand-50' : ''
                                      }`}
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          enterpriseId: enterprise.id,
                                          enterprise: undefined
                                        }));
                                        setEnterpriseSearch(enterprise.name);
                                        setEnterpriseOptions([]);
                                      }}
                                    >
                                      {enterprise.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* New Enterprise Option */}
                        <div className="p-3 border rounded-lg">
                          <label className="flex items-center font-medium">
                            <input
                              type="radio"
                              name="enterpriseOption"
                              value="new"
                              className="mr-2"
                              checked={!!formData.enterprise}
                              onChange={() => setFormData(prev => ({ 
                                ...prev, 
                                enterpriseId: undefined,
                                enterprise: { enterpriseName: '', description: '' }
                              }))}
                            />
                            Register New Enterprise
                          </label>
                            
                          {formData.enterprise && (
                            <div className="mt-3 space-y-3">
                              <Input
                                placeholder="Enterprise Name *"
                                value={formData.enterprise.enterpriseName}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                                  setFormData(prev => ({
                                    ...prev,
                                    enterprise: {
                                      ...prev.enterprise!,
                                      enterpriseName: value
                                    }
                                  }))
                                }
                              } 
                              />
                              <Input
                                placeholder="Description *"
                                value={formData.enterprise.description}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  enterprise: {
                                    ...prev.enterprise!,
                                    description: e.target.value
                                  }
                                }))}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Zones to Manage</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.zones?.map((zone, index) => (
                          <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <span>{zone}</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                zones: prev.zones?.filter((_, i) => i !== index)
                              }))}
                              className="ml-2 text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex mt-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Add zone"
                            name="newZone"
                            value={formData.newZone || ''}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                              setFormData(prev => ({
                              ...prev,
                              newZone: value
                            }))

                              }
                            }
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (formData.newZone?.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  zones: [...(prev.zones || []), prev.newZone!.trim()],
                                  newZone: ''
                                }));
                              }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-brand-500 text-white rounded"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button 
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing up...' : 'Sign Up'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
