import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, router } from 'expo-router';
import { useAuth } from '../_components/context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../_components/UI/ToastConfig';


const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

export default function LoginScreen() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('success', 'Successfull Login!');
  };

  const handleError = () => {
    showToast('error', 'Something went wrong!');
  };


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const user = await login(values.email, values.password);
      // Update context/state with user data
      router.replace('/(tabs)/home');
      handleSuccess()
    } catch (error) {
      handleError()
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixiny</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
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
              Login
            </Button>
          </View>
        )}
      </Formik>

      <Link href="/(auth)/register" asChild>
        <Text style={styles.link}>Don't have an account? Register</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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