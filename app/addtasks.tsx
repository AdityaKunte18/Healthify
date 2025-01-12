

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router"; 
import { useDatabase } from "@/context/DatabaseContext";

export default function AddTasks() {
  const { db, isDbInitialized } = useDatabase();
  const router = useRouter();
  
  const { registrationNumber } = useLocalSearchParams<{
    registrationNumber: string;
  }>();

  
  const [labType, setLabType] = useState<"blood"|"urine"|"miscellanous">("blood");
  const [labSubtype, setLabSubtype] = useState("");

  
  const [imagingType, setImagingType] = useState<"X-RAY"|"CT"|"MRI"|"USG">("X-RAY");
  const [imagingSubtype, setImagingSubtype] = useState("");

  
  const [consultationText, setConsultationText] = useState("");

  const handleAddLab = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!labSubtype.trim()) {
      Alert.alert("Error", "Lab subtype cannot be empty.");
      return;
    }

    try {
      await db.runAsync(
        "INSERT INTO tasks (registrationNumber, lab_type, lab_subtype) VALUES (?, ?, ?)",
        [registrationNumber, labType, labSubtype.trim()]
      );
      Alert.alert("Success", "Lab task added successfully!");
      setLabSubtype(""); 
    } catch (error) {
      console.error("Error adding lab:", error);
      Alert.alert("Error", "Failed to add lab task.");
    }
  };


  const handleAddOldLab = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!labSubtype.trim()) {
      Alert.alert("Error", "Lab subtype cannot be empty.");
      return;
    }

    try {
      await db.runAsync(
        "INSERT INTO oldlabs (registrationNumber, lab_type, lab_subtype) VALUES (?, ?, ?)",
        [registrationNumber, labType, labSubtype.trim()]
      );
      Alert.alert("Success", "Old lab task added successfully!");
      setLabSubtype(""); 
    } catch (error) {
      console.error("Error adding old lab:", error);
      Alert.alert("Error", "Failed to add old lab task.");
    }
  };

  const handleAddImaging = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!imagingSubtype.trim()) {
      Alert.alert("Error", "Imaging subtype cannot be empty.");
      return;
    }

    try {
      await db.runAsync(
        "INSERT INTO tasks (registrationNumber, imaging_type, imaging_subtype) VALUES (?, ?, ?)",
        [registrationNumber, imagingType, imagingSubtype.trim()]
      );
      Alert.alert("Success", "Imaging task added successfully!");
      setImagingSubtype(""); 
    } catch (error) {
      console.error("Error adding imaging:", error);
      Alert.alert("Error", "Failed to add imaging task.");
    }
  };


  const handleAddOldImaging = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!imagingSubtype.trim()) {
      Alert.alert("Error", "Imaging subtype cannot be empty.");
      return;
    }

    try {
      await db.runAsync(
        "INSERT INTO oldlabs (registrationNumber, imaging_type, imaging_subtype) VALUES (?, ?, ?)",
        [registrationNumber, imagingType, imagingSubtype.trim()]
      );
      Alert.alert("Success", "Old imaging task added successfully!");
      setImagingSubtype(""); 
    } catch (error) {
      console.error("Error adding old imaging:", error);
      Alert.alert("Error", "Failed to add old imaging task.");
    }
  };

  
  const handleAddConsultation = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!consultationText.trim()) {
      Alert.alert("Error", "Consultation text cannot be empty.");
      return;
    }

    try {
      
      const existing = await db.getFirstAsync<{
        id: number;
        registrationNumber: string;
        consult: string;
      }>(
        "SELECT id FROM consultations WHERE registrationNumber = ? AND consult = ?",
        [registrationNumber.trim(), consultationText.trim()]
      );

      
      await db.runAsync(
        "INSERT INTO consultations (registrationNumber, consult) VALUES (?, ?)",
        [registrationNumber.trim(), consultationText.trim()]
      );
      Alert.alert("Success", "Consultation added successfully!");
      setConsultationText(""); 
    } catch (error) {
      console.error("Error adding consultation:", error);
      Alert.alert("Error", "Failed to add consultation.");
    }
  };

  const handleAddOldConsultation = async () => {
    if (!db || !isDbInitialized) {
      Alert.alert("Error", "Database is not initialized yet.");
      return;
    }

    if (!registrationNumber) {
      Alert.alert("Error", "No registration number found.");
      return;
    }

    if (!consultationText.trim()) {
      Alert.alert("Error", "Consultation text cannot be empty.");
      return;
    }

    try {
      
      const existing = await db.getFirstAsync<{
        id: number;
        registrationNumber: string;
        consult: string;
      }>(
        "SELECT id FROM oldconsultations WHERE registrationNumber = ? AND consult = ?",
        [registrationNumber.trim(), consultationText.trim()]
      );

      if (existing) {
        Alert.alert("Warning", "This old consultation already exists.");
        return;
      }

      
      await db.runAsync(
        "INSERT INTO oldconsultations (registrationNumber, consult) VALUES (?, ?)",
        [registrationNumber.trim(), consultationText.trim()]
      );
      Alert.alert("Success", "Old consultation added successfully!");
      setConsultationText(""); 
    } catch (error) {
      console.error("Error adding old consultation:", error);
      Alert.alert("Error", "Failed to add old consultation.");
    }
  };

  const handleDone = () => {
    
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        Add Tasks for Patient #{registrationNumber}
      </Text>

      {/* 1. Lab Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Labs</Text>
        <Picker
          selectedValue={labType}
          onValueChange={(value) => setLabType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Blood" value="blood" />
          <Picker.Item label="Urine" value="urine" />
          <Picker.Item label="Miscellanous" value="miscellanous" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Lab Subtype (e.g., CBC, culture, etc.)"
          value={labSubtype}
          onChangeText={setLabSubtype}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddLab}>
          <Text style={styles.buttonText}>Add Lab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addOldButton} onPress={handleAddOldLab}>
          <Text style={styles.buttonText}>Add Old Lab</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Imaging Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imaging</Text>
        <Picker
          selectedValue={imagingType}
          onValueChange={(value) => setImagingType(value)}
          style={styles.picker}
        >
          <Picker.Item label="X-RAY" value="X-RAY" />
          <Picker.Item label="CT" value="CT" />
          <Picker.Item label="MRI" value="MRI" />
          <Picker.Item label="USG" value="USG" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Imaging Subtype (e.g., Chest, Abdomen, etc.)"
          value={imagingSubtype}
          onChangeText={setImagingSubtype}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddImaging}>
          <Text style={styles.buttonText}>Add Imaging</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addOldButton} onPress={handleAddOldImaging}>
          <Text style={styles.buttonText}>Add Old Imaging</Text>
        </TouchableOpacity>

      </View>

      {/* 3. Consultations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultations</Text>

        <TextInput
          style={styles.input}
          placeholder="Consultation Details (e.g., Follow-up, Specialist Referral, etc.)"
          value={consultationText}
          onChangeText={setConsultationText}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddConsultation}>
          <Text style={styles.buttonText}>Add Consultation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addOldButton} onPress={handleAddOldConsultation}>
          <Text style={styles.buttonText}>Add Old Consultation</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Done Button */}
      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    backgroundColor: "#F9F9F9",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  addButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  addOldButton: {
    backgroundColor: "grey",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  doneButton: {
    backgroundColor: "green",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
