import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, router } from 'expo-router';
import { useAuth } from '../_components/context/AuthContext';
import { useState } from 'react';
import { useToast } from '../_components/UI/ToastConfig';

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Too short!').required('Password is required'),
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  phoneNumber: Yup.string()
    .matches(/^\+216\d{8}$/, 'Phone must be +216 followed by 8 digits')
    .required('Phone is required'),
});

interface RegisterValues {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('success', 'Successfull Registration!');
  };

  const handleError = () => {
    showToast('error', 'Something went wrong!');
  };

  const handleRegister = async (values: RegisterValues) => {
    try {
      await register({
        ...values,
        role: 'PARTICULIER', // Force particulier role for mobile
        status: 'PENDING'
      });
      router.replace('/(auth)/login');
      handleSuccess()
    } catch (err) {
      handleError()
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <Formik
        initialValues={{ 
          email: '', 
          password: '', 
          first_name: '', 
          last_name: '',
          phone_number: '' 
        }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <TextInput
              label="First Name"
              mode="outlined"
              onChangeText={handleChange('first_name')}
              onBlur={handleBlur('first_name')}
              value={values.first_name}
              error={touched.first_name && !!errors.first_name}
            />
            {touched.first_name && errors.first_name && (
              <Text style={styles.errorText}>{errors.first_name}</Text>
            )}

            <TextInput
              label="Last Name"
              mode="outlined"
              onChangeText={handleChange('last_name')}
              onBlur={handleBlur('last_name')}
              value={values.last_name}
              error={touched.last_name && !!errors.last_name}
            />
            {touched.last_name && errors.last_name && (
              <Text style={styles.errorText}>{errors.last_name}</Text>
            )}

            <TextInput
              label="Email"
              mode="outlined"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              keyboardType="email-address"
              autoCapitalize="none"
              error={touched.email && !!errors.email}
            />
            {touched.email && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              label="Phone Number"
              mode="outlined"
              onChangeText={handleChange('phone_number')}
              onBlur={handleBlur('phone_number')}
              value={values.phone_number}
              keyboardType="phone-pad"
              error={touched.phone_number && !!errors.phone_number}
            />
            <HelperText type="info" visible={!errors.phone_number}>
              Format: +21612345678
            </HelperText>
            {touched.phone_number && errors.phone_number && (
              <Text style={styles.errorText}>{errors.phone_number}</Text>
            )}

            <PasswordInput
              label="Password"
              mode="outlined"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              secureTextEntry
              error={touched.password && !!errors.password}
            />
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <Button 
              mode="contained" 
              onPress={() => handleSubmit()}
              style={styles.button}
            >
              Register
            </Button>
          </View>
        )}
      </Formik>

      <Link href="/(auth)/login" asChild>
        <Text style={styles.link}>Already have an account? Login</Text>
      </Link>
    </View>
  );
}

const PasswordInput = ({ ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      secureTextEntry={!visible}
      right={
        <TextInput.Icon 
          icon={visible ? "eye-off" : "eye"} 
          onPress={() => setVisible(!visible)}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  link: {
    color: 'blue',
    textAlign: 'center',
    marginTop: 15,
  },
});