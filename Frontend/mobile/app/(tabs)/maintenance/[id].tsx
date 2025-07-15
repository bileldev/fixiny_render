import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as particulierApi from '../../_components/api/particulier';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import DatePickerField from '@/app/_components/UI/DatePickerField';
import { useToast } from '@/app/_components/UI/ToastConfig';

const MaintenanceSchema = Yup.object().shape({
  car_id: Yup.string().required('Car is required'),
  type: Yup.string().required('Type is required'),
  date: Yup.date().required('Date is required'),
  recordedMileage: Yup.number().min(0).required('Mileage is required'),
  cost: Yup.number().min(0).required('Cost is required'),
  description: Yup.string(),
  status: Yup.string().required('Status is required'),
});

export default function EditMaintenanceScreen() {
  const { id, maintenance } = useLocalSearchParams();
  const parsedMaintenance = maintenance ? JSON.parse(maintenance as string) : null;
  const [cars, setCars] = useState<{id: string, make: string, model: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const [initialValues, setInitialValues] = useState({
    car_id: parsedMaintenance?.car_id || '',
    type: parsedMaintenance?.type || '',
    date: parsedMaintenance?.date ? new Date(parsedMaintenance.date) : new Date(),
    recordedMileage: parsedMaintenance?.recordedMileage.toString() || '',
    cost: parsedMaintenance?.cost.toString() || '',
    description: parsedMaintenance?.description || '',
    status: parsedMaintenance?.status || '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('success', 'Maintenance updated successfully!');
  };

  const handleError = () => {
    showToast('error', 'Something went wrong!');
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carsData] = await Promise.all([
          particulierApi.getCars(),
        ]);        
        setCars(carsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const maintenanceData = {
        ...values,
        recordedMileage: parseInt(values.recordedMileage),
        cost: parseFloat(values.cost),
        date: values.date.toISOString(),
        
      };

      if (typeof id === 'string') {
        await particulierApi.saveMaintenance(maintenanceData, id);
      }
      router.back();
      handleSuccess()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update maintenance');
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
        Edit Maintenance
      </Text>

      <Formik
        initialValues={initialValues}
        validationSchema={MaintenanceSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ 
          handleChange, 
          handleBlur, 
          handleSubmit, 
          setFieldValue,
          values, 
          errors, 
          touched 
        }) => (
          <View style={styles.form}>

            <Text style={styles.label}>Select Car:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={values.car_id}
                onValueChange={(itemValue) => setFieldValue('car_id', itemValue)}
                style={styles.picker}
              >
                {cars.map((car) => (
                  <Picker.Item 
                    key={car.id} 
                    label={`${car.make} ${car.model}`} 
                    value={car.id} 
                  />
                ))}
              </Picker>
            </View>
            {touched.car_id && errors.car_id && (
              <HelperText type="error">
                {typeof errors.car_id === 'string' ? errors.car_id : 'Invalid value'}
              </HelperText>
            )}

            <TextInput
              label="Type"
              mode="outlined"
              disabled
              onChangeText={handleChange('type')}
              onBlur={handleBlur('type')}
              value={values.type}
              error={touched.type && !!errors.type}
            />
            {touched.type && errors.type && (
              <HelperText type="error">{typeof errors.type === 'string' ? errors.type : 'Invalid value'}</HelperText>
            )}

            <DatePickerField name='date'/>
            <HelperText type="info">
              Format: DD/MM/YYYY
            </HelperText>

            <TextInput
              label="Recorded Mileage"
              mode="outlined"
              onChangeText={handleChange('recordedMileage')}
              onBlur={handleBlur('recordedMileage')}
              value={values.recordedMileage}
              keyboardType="numeric"
              error={touched.recordedMileage && !!errors.recordedMileage}
              style={styles.input}
            />
            {touched.recordedMileage && errors.recordedMileage && (
              <HelperText type="error">{typeof errors.recordedMileage === 'string' ? errors.recordedMileage : 'Invalid value'}</HelperText>
            )}

            <TextInput
              label="Cost"
              mode="outlined"
              onChangeText={handleChange('cost')}
              onBlur={handleBlur('cost')}
              value={values.cost}
              keyboardType="numeric"
              error={touched.cost && !!errors.cost}
              style={styles.input}
            />
            {touched.cost && errors.cost && (
              <HelperText type="error">{typeof errors.cost === 'string' ? errors.cost : 'Invalid value'}</HelperText>
            )}

            <TextInput
              label="Description"
              mode="outlined"
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              value={values.description}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Button 
              mode="contained" 
              onPress={() => handleSubmit()}
              style={styles.button}
            >
              Update Maintenance
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
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
  },
  input: {
    marginTop: 10,
  },
  button: {
    marginTop: 20,
  },
});