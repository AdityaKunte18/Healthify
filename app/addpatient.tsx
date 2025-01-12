

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useDatabase } from "@/context/DatabaseContext";

export default function AddPatient() {
  const router = useRouter();
  const { db, isDbInitialized } = useDatabase();

  
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [location, setLocation] = useState("Emergency");
  const [bedNumber, setBedNumber] = useState("");
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [miscNotes, setMiscNotes] = useState("");
  const [number, setNumber] = useState("");

  const handleSubmit = async () => {
    
    if (!db) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    
    if (
      !registrationNumber.trim() ||
      !patientName.trim() ||
      !age.trim() ||
      !bedNumber.trim() ||
      !chiefComplaints.trim() ||
      !provisionalDiagnosis.trim() ||
      !number.trim()
    ) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    
    const parsedAge = parseInt(age, 10);
    const parsedBedNumber = parseInt(bedNumber, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      Alert.alert("Error", "Please enter a valid positive age.");
      return;
    }
    if (isNaN(parsedBedNumber) || parsedBedNumber <= 0) {
      Alert.alert("Error", "Please enter a valid positive bed number.");
      return;
    }


    try {
      
      const existingPatient = await db.getFirstAsync<{
        id: number;
        registrationNumber: string;
      }>(
        "SELECT id, registrationNumber FROM patients WHERE registrationNumber = ?",
        [registrationNumber.trim()]
      );

      if (existingPatient) {
        Alert.alert(
          "Error",
          `Patient with registration number '${registrationNumber}' already exists.`
        );
        return;
      }

      
      
      await db.runAsync(
        `
        INSERT INTO patients (
          patientName,
          age,
          gender,
          registrationNumber,
          location,
          bedNumber,
          chiefComplaints,
          provisionalDiagnosis,
          miscNotes,
          contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        patientName.trim(),
        parsedAge,
        gender,
        registrationNumber.trim(),
        location,
        parsedBedNumber,
        chiefComplaints.trim(),
        provisionalDiagnosis.trim(),
        miscNotes.trim(),
        number.trim()
      );

      Alert.alert("Success", "Patient added successfully!", [
        {
          text: "OK",
          onPress: () => router.push({
            pathname: "/addtasks",
            params: {
              registrationNumber: registrationNumber.trim(),
            },
          }),
        },
      ]);
    } catch (error) {
      console.error("Error adding patient:", error);
      Alert.alert("Error", "Failed to add patient. Please try again.");
    }
  };

  const handleCancel = () => {
    
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Registration Number */}
      <TextInput
        style={styles.input}
        placeholder="Registration Number"
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
      />

      {/* Patient Name */}
      <TextInput
        style={styles.input}
        placeholder="Patient Name"
        value={patientName}
        onChangeText={setPatientName}
      />

      {/* Age */}
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      {/* Contact Number */}
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={number}
        onChangeText={setNumber}
        keyboardType="numeric"
      />

      {/* Gender */}
      <Text style={styles.label}>Gender</Text>
      <Picker
        selectedValue={gender}
        onValueChange={(itemValue) => setGender(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <Picker
        selectedValue={location}
        onValueChange={(itemValue) => setLocation(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Emergency" value="Emergency" />
        <Picker.Item label="ICU" value="ICU" />
        <Picker.Item label="HDU" value="HDU" />
        <Picker.Item label="Ward Male" value="Ward Male" />
        <Picker.Item label="Ward Female" value="Ward Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      {/* Bed Number */}
      <TextInput
        style={styles.input}
        placeholder="Bed Number"
        value={bedNumber}
        onChangeText={setBedNumber}
        keyboardType="numeric"
      />

      {/* Chief Complaints */}
      <TextInput
        style={styles.input}
        placeholder="Chief Complaints"
        value={chiefComplaints}
        onChangeText={setChiefComplaints}
      />

      {/* Provisional Diagnosis */}
      <TextInput
        style={styles.input}
        placeholder="Provisional Diagnosis"
        value={provisionalDiagnosis}
        onChangeText={setProvisionalDiagnosis}
      />

      {/* Misc Notes */}
      <TextInput
        style={styles.input}
        placeholder="Misc Notes"
        value={miscNotes}
        onChangeText={setMiscNotes}
      />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    marginBottom: 15,
    height: 50,
    justifyContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
