import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useFormikContext } from 'formik';

export default function DatePickerField({ name }: { name: string }) {
  const { setFieldValue, values, errors, touched } = useFormikContext<any>();
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setFieldValue(name, selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          label="Date"
          value={values[name]?.toLocaleDateString() || ''}
          mode="outlined"
          editable={false}
          style={styles.input}
          error={touched[name] && !!errors[name]}
        />
        <Button 
          mode="contained-tonal" 
          onPress={() => setShowPicker(true)}
          style={styles.button}
        >
          Change
        </Button>
      </View>

      {showPicker && (
        <DateTimePicker
          value={values[name] || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {touched[name] && errors[name] && (
        <HelperText type="error" style={styles.error}>
          {errors[name] as string}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  button: {
    height: 56, // Match TextInput height
    justifyContent: 'center',
  },
  error: {
    marginTop: 4,
  },
});