import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useLocalSearchParams, router } from 'expo-router';
import * as particulierApi from '../../_components/api/particulier';
import { useAuth } from '../../_components/context/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/app/_components/UI/ToastConfig';

const CarSchema = Yup.object().shape({
  make: Yup.string().required('Make is required'),
  model: Yup.string().required('Model is required'),
  year: Yup.number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required('Year is required'),
  vin_number: Yup.string()
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN must be 17 alphanumeric characters')
    .required('VIN is required'),
  licensePlate: Yup.string()
    .matches(/^(\d{1,3}\s?[A-Z]{1,2}\s?\d{1,4})$/, 'e.g. 123 AB 4567')
    .required('License plate is required'),
  initial_mileage: Yup.number().min(0).required('Initial mileage is required'),
});

export default function EditCarScreen() {
  const { id, car } = useLocalSearchParams();
  const parsedCar = car ? JSON.parse(car as string) : null;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [initialValues, setInitialValues] = useState({
    make: '',
    model: '',
    year: '2000',
    licensePlate: '',
    vin_number: '',
    initial_mileage: '0',
  });

  const { showToast } = useToast();
  
    const handleSuccess = () => {
      showToast('success', 'Car updated successfully!');
    };
  
    const handleError = () => {
      showToast('error', 'Something went wrong!');
    };
  

  useEffect(() => {
    if (car) {
      try {
        const parsedCar = JSON.parse(car as string);
        setInitialValues({
          make: parsedCar.make,
          model: parsedCar.model,
          year: parsedCar.year.toString(),
          licensePlate: parsedCar.licensePlate,
          vin_number: parsedCar.vin_number,
          initial_mileage: parsedCar.initial_mileage.toString()
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to parse car data:", error);
        router.back();
      }
    } else {
      // Handle case where car data isn't passed
      console.warn("No car data provided");
      router.back();
    }
  }, [car]);

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      if (!user) {
        alert('You must be logged in');
        return router.push('/(auth)/login');
      }

      const carData = {
        ...values,
        year: parseInt(values.year),
        initial_mileage: parseFloat(values.initial_mileage),
        user_id: user.id
      };

      if (typeof id === 'string') {
        await particulierApi.saveCar(carData, id);
      }
      router.back();
      handleSuccess()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update car');
      handleError()
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Edit Car
      </Text>

      <Formik
        initialValues={initialValues}
        validationSchema={CarSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <TextInput
              label="Make"
              mode="outlined"
              onChangeText={handleChange('make')}
              onBlur={handleBlur('make')}
              value={values.make}
              error={touched.make && !!errors.make}
            />
            {touched.make && errors.make && (
              <Text style={styles.errorText}>{typeof errors.make === 'string' ? errors.make : 'Invalid value'}</Text>
            )}
            <TextInput
              label="Model"
              mode="outlined"
              onChangeText={handleChange('model')}
              onBlur={handleBlur('model')}
              value={values.model}
              error={touched.model && !!errors.model}
              style={styles.input}
            />
            {touched.model && errors.model && (
              <Text style={styles.errorText}>{typeof errors.model === 'string' ? errors.model : 'Invalid value'}</Text>
            )}

            <TextInput
              label="Year"
              mode="outlined"
              onChangeText={handleChange('year')}
              onBlur={handleBlur('year')}
              value={values.year}
              keyboardType="numeric"
              error={touched.year && !!errors.year}
              style={styles.input}
            />
            {touched.year && errors.year && (
              <Text style={styles.errorText}>{typeof errors.year === 'string' ? errors.year : 'Invalid value'}</Text>
            )}

            <TextInput
              label="License Plate"
              mode="outlined"
              onChangeText={handleChange('licensePlate')}
              onBlur={handleBlur('licensePlate')}
              value={values.licensePlate}
              error={touched.licensePlate && !!errors.licensePlate}
              style={styles.input}
            />
            <HelperText type="info" visible={!errors.licensePlate}>
              Format: xxx TU xxxx
            </HelperText>
            {touched.licensePlate && errors.licensePlate && (
              <Text style={styles.errorText}>{typeof errors.licensePlate === 'string' ? errors.licensePlate : 'Invalid value'}</Text>
            )}

            <TextInput
              label="VIN Number"
              mode="outlined"
              onChangeText={handleChange('vin_number')}
              onBlur={handleBlur('vin_number')}
              value={values.vin_number}
              error={touched.vin_number && !!errors.vin_number}
              style={styles.input}
            />
            <HelperText type="info" visible={!errors.vin_number}>
              17 characters (letters and numbers)
            </HelperText>
            {touched.vin_number && errors.vin_number && (
              <Text style={styles.errorText}>{typeof errors.vin_number === 'string' ? errors.vin_number : 'Invalid value'}</Text>
            )}

            <TextInput
              label="Initial Mileage"
              mode="outlined"
              onChangeText={handleChange('initial_mileage')}
              onBlur={handleBlur('initial_mileage')}
              value={values.initial_mileage}
              keyboardType="numeric"
              error={touched.initial_mileage && !!errors.initial_mileage}
              style={styles.input}
            />
            {touched.initial_mileage && errors.initial_mileage && (
              <Text style={styles.errorText}>{typeof errors.initial_mileage === 'string' ? errors.initial_mileage : 'Invalid value'}</Text>
            )}

            <Button 
              mode="contained" 
              onPress={() => handleSubmit()}
              style={styles.button}
            >
              Update Car
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    marginTop: 10,
  },
  button: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
});