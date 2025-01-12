

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDatabase } from "../context/DatabaseContext";
import { Picker } from "@react-native-picker/picker";

/**
 * Interface representing a Patient record.
 */
interface Patient {
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  registrationNumber: string;
  location:
    | "Emergency"
    | "ICU"
    | "HDU"
    | "Ward Male"
    | "Ward Female"
    | "Other";
  bedNumber?: number;
  chiefComplaints?: string;
  provisionalDiagnosis?: string;
  miscNotes?: string;
  reg_date: string;
  contact: string;
}

export default function EditPatient() {
  const { registrationNumber: originalRegistrationNumber } = useLocalSearchParams<{
    registrationNumber: string;
  }>();

  const { db, isDbInitialized } = useDatabase();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDbInitialized && db && originalRegistrationNumber) {
      fetchPatientDetails();
    }
  }, [isDbInitialized, db, originalRegistrationNumber]);

  /**
   * Fetch patient details based on the provided registration number.
   */
  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const fetchedPatient = await db.getFirstAsync<Patient>(
        "SELECT * FROM patients WHERE registrationNumber = ?",
        [originalRegistrationNumber]
      );
      setPatient(fetchedPatient);
      setError(null);
    } catch (err) {
      console.error("Error fetching patient details:", err);
      setError("Failed to load patient details.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a registration number already exists in the database.
   * Excludes the current patient by originalRegistrationNumber.
   * @param regNumber The registration number to check.
   * @returns Boolean indicating existence.
   */
  const checkRegistrationNumberExists = async (regNumber: string): Promise<boolean> => {
    try {
      const existingPatient = await db.getFirstAsync<Patient>(
        "SELECT * FROM patients WHERE registrationNumber = ? AND registrationNumber != ?",
        [regNumber, originalRegistrationNumber]
      );
      return !!existingPatient;
    } catch (err) {
      console.error("Error checking registration number:", err);
  
      return true;
    }
  };

  /**
   * Handle updating patient details.
   */
  const handleUpdate = async () => {
    if (!patient) return;


    if (!patient.patientName.trim()) {
      setError("Patient name is required.");
      return;
    }
    if (isNaN(patient.age) || patient.age <= 0) {
      setError("Please enter a valid age.");
      return;
    }
    if (!patient.registrationNumber.trim()) {
      setError("Registration number is required.");
      return;
    }
    if (!patient.location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!patient.contact.trim()) {
      setError("Contact information is required.");
      return;
    }

    try {
      setUpdating(true);

  
      const regNumberChanged = patient.registrationNumber !== originalRegistrationNumber;
      if (regNumberChanged) {
        const exists = await checkRegistrationNumberExists(patient.registrationNumber);
        if (exists) {
          setError("Registration number already exists.");
          setUpdating(false);
          return;
        }
      }

  
      await db.runAsync("BEGIN TRANSACTION");

  
      await db.runAsync(
        `UPDATE patients 
         SET patientName = ?, age = ?, gender = ?, registrationNumber = ?, location = ?, bedNumber = ?, chiefComplaints = ?, provisionalDiagnosis = ?, miscNotes = ?, contact = ?
         WHERE registrationNumber = ?`,
        [
          patient.patientName,
          patient.age,
          patient.gender,
          patient.registrationNumber,
          patient.location,
          patient.bedNumber || null,
          patient.chiefComplaints || null,
          patient.provisionalDiagnosis || null,
          patient.miscNotes || null,
          patient.contact,
          originalRegistrationNumber
        ]
      );

  
      if (regNumberChanged) {
    
        await db.runAsync(
          `UPDATE tasks 
           SET registrationNumber = ?
           WHERE registrationNumber = ?`,
          [patient.registrationNumber, originalRegistrationNumber]
        );

    
        await db.runAsync(
          `UPDATE oldlabs 
           SET registrationNumber = ?
           WHERE registrationNumber = ?`,
          [patient.registrationNumber, originalRegistrationNumber]
        );
      }

  
      await db.runAsync("COMMIT");

      setError(null);
      Alert.alert("Success", "Patient details updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError("Failed to update patient details.");

  
      try {
        await db.runAsync("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading patient details...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{error}</Text>
        </View>
      )}

      {/* Patient Details Form */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Patient Name</Text>
        <TextInput
          style={styles.input}
          value={patient.patientName}
          onChangeText={(text) =>
            setPatient({ ...patient, patientName: text })
          }
          placeholder="Enter patient name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={patient.age ? patient.age.toString() : ""}
          onChangeText={(text) =>
            setPatient({ ...patient, age: parseInt(text) || 0 })
          }
          placeholder="Enter age"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patient.gender}
            onValueChange={(itemValue) =>
              setPatient({ ...patient, gender: itemValue as "Male" | "Female" | "Other" })
            }
            mode="dropdown"
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={styles.input}
          value={patient.registrationNumber}
          onChangeText={(text) =>
            setPatient({ ...patient, registrationNumber: text })
          }
          placeholder="Enter registration number"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patient.location}
            onValueChange={(itemValue) =>
              setPatient({
                ...patient,
                location:
                  itemValue as
                    | "Emergency"
                    | "ICU"
                    | "HDU"
                    | "Ward Male"
                    | "Ward Female"
                    | "Other",
              })
            }
            mode="dropdown"
            style={styles.picker}
          >
            <Picker.Item label="Select Location" value="" />
            <Picker.Item label="Emergency" value="Emergency" />
            <Picker.Item label="ICU" value="ICU" />
            <Picker.Item label="HDU" value="HDU" />
            <Picker.Item label="Ward Male" value="Ward Male" />
            <Picker.Item label="Ward Female" value="Ward Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Bed Number</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={patient.bedNumber ? patient.bedNumber.toString() : ""}
          onChangeText={(text) =>
            setPatient({ ...patient, bedNumber: parseInt(text) || undefined })
          }
          placeholder="Enter bed number (optional)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Chief Complaints</Text>
        <TextInput
          style={styles.input}
          value={patient.chiefComplaints}
          onChangeText={(text) =>
            setPatient({ ...patient, chiefComplaints: text })
          }
          placeholder="Enter chief complaints (optional)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Provisional Diagnosis</Text>
        <TextInput
          style={styles.input}
          value={patient.provisionalDiagnosis}
          onChangeText={(text) =>
            setPatient({ ...patient, provisionalDiagnosis: text })
          }
          placeholder="Enter provisional diagnosis (optional)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Misc Notes</Text>
        <TextInput
          style={styles.input}
          value={patient.miscNotes}
          onChangeText={(text) =>
            setPatient({ ...patient, miscNotes: text })
          }
          placeholder="Enter misc notes (optional)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={patient.contact}
          onChangeText={(text) =>
            setPatient({ ...patient, contact: text })
          }
          placeholder="Enter contact information"
        />
      </View>

      {/* Update Button */}
      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdate}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Details</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#f5f6fa",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 16,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderColor: "#3498db",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    borderColor: "#3498db",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  updateButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#34495e",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    textAlign: "center",
  },
  errorBox: {
    padding: 12,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
