import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function UserMetaCard() {
  const fileInputRef = useRef<HTMLInputElement>(null); // Properly typed ref
  const [profileImage, setProfileImage] = useState('/images/user/owner.png');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    photo:'',
    role: '',
    enterprise: ''
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/get-profile', {
          credentials: 'include'
        });
        const data = await response.json();
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          photo: data.photo || '',
          role: data.role || '',
          enterprise: data.enterprise.enterprise_name || '',
        });
        setProfileImage(data.photo)
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const isValidImage = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the image first
    if (!isValidImage(file)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF) under 5MB');
      return; // Exit early if invalid
    }

    // Immediate preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/user/update-profile/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { photoUrl } = await response.json();
      setProfileImage(photoUrl);
      toast.success('Profile picture updated!');

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

   const handleEditClick = () => {
    if (fileInputRef.current) { // Null check
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img 
                src={previewImage || `http://localhost:3001${profileImage}`}
                onError={(e) => {
                  e.currentTarget.src = '/images/user/owner.png'; // Fallback
                }}
                alt="user" 
                className="object-cover w-full h-full"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <span className="text-white">Uploading...</span>
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile.first_name} {profile.last_name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.role === 'CHEF_PARK' ? 'Chef de park' : ''}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.enterprise}
                </p>
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={handleEditClick}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8C2 6.89543 2.89543 6 4 6H5.5C6.05228 6 6.5 5.55228 6.5 5C6.5 4.44772 6.94772 4 7.5 4H10.5C11.0523 4 11.5 4.44772 11.5 5C11.5 5.55228 11.9477 6 12.5 6H14C15.1046 6 16 6.89543 16 8V17C16 18.1046 15.1046 19 14 19H4C2.89543 19 2 18.1046 2 17V8Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="9"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {isUploading ? 'Uploading...' : 'Upload photo'}
          </button>
        </div>
      </div>
    </>
  );
}
