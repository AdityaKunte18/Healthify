

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDatabase } from "../context/DatabaseContext";
import { useIsFocused } from "@react-navigation/native"; 

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
  is_discharged: number; 
}

type ViewMode = "simple" | "detailed";

/**
 * ReviewOldPatients component allows users to view a list of discharged patients
 * in either 'simple' or 'detailed' view modes with search and re-admit functionality.
 */
export default function ReviewOldPatients() {
  const { db, isDbInitialized } = useDatabase();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isFocused = useIsFocused(); 

  useEffect(() => {
    if (isDbInitialized && db && isFocused) {
      fetchPatients();
    }
  }, [isDbInitialized, db, isFocused]); 

  /**
   * Fetch all discharged patients from the database, sorted by reg_date descending.
   */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const fetchedPatients = await db.getAllAsync<Patient>(
        "SELECT * FROM patients WHERE is_discharged = 1 ORDER BY reg_date DESC"
      );
      setPatients(fetchedPatients);
      setFilteredPatients(fetchedPatients);
      setError(null);
    } catch (err) {
      console.error("Error fetching discharged patients:", err);
      setError("Failed to load discharged patients.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search functionality to filter patients by name or registration number.
   */
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (patient) =>
          patient.patientName.toLowerCase().includes(query) ||
          patient.registrationNumber.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
    Keyboard.dismiss(); 
  };

  /**
   * Toggle between 'simple' and 'detailed' view modes.
   */
  const toggleViewMode = () => {
    setViewMode((prevMode) =>
      prevMode === "simple" ? "detailed" : "simple"
    );
  };

  /**
   * Navigate to the EditPatient screen with the patient's Registration Number.
   * @param registrationNumber - The registration number of the patient.
   */
  const handleEditDetails = (registrationNumber: string) => {
    router.push({
      pathname: '/editpatient',
      params: {
        registrationNumber: registrationNumber.trim(),
      }
    });
  };

  const handleViewTasks = (registrationNumber:string, patientName:string) => {
    router.push({
      pathname:'/viewtasks',
      params: {
        registrationNumber: registrationNumber.trim(),
        patientName: patientName.trim()
      }
    });
  };


  /**
   * Handle re-admitting a patient by updating is_discharged to 0.
   * @param registrationNumber - The registration number of the patient to re-admit.
   */
  const handleReAdmitPatient = async (registrationNumber: string) => {
    Alert.alert(
      "Confirm Re-admission",
      `Are you sure you want to re-admit patient with Registration Number: ${registrationNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Re-admit", style: "default", onPress: () => reAdmit(registrationNumber) },
      ]
    );
  };

  /**
   * Perform the re-admission operation.
   * @param registrationNumber - The registration number of the patient to re-admit.
   */
  const reAdmit = async (registrationNumber: string) => {
    try {
      setLoading(true);
      await db.runAsync(
        "UPDATE patients SET is_discharged = 0 WHERE registrationNumber = ?",
        [registrationNumber]
      );
      setError(null);
      Alert.alert("Success", "Patient re-admitted successfully.", [
        { text: "OK" },
      ]);
      fetchPatients(); 
    } catch (err) {
      console.error("Error re-admitting patient:", err);
      setError("Failed to re-admit patient.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render each patient item in the FlatList.
   * @param item - Patient data.
   */
  const renderItem = ({ item }: { item: Patient }) => {
    return (
      <View style={styles.patientCard}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.patientInfo}>
          Registration Number: {item.registrationNumber}
        </Text>
        <Text style={styles.patientInfo}>Gender: {item.gender}</Text>
        <Text style={styles.patientInfo}>Location: {item.location}</Text>
        <Text style={styles.patientInfo}>
          Date of Admission: {item.reg_date}
        </Text>
        {viewMode === "detailed" && (
          <>
            <Text style={styles.patientInfo}>Age: {item.age}</Text>
            {item.bedNumber !== undefined && (
              <Text style={styles.patientInfo}>
                Bed Number: {item.bedNumber}
              </Text>
            )}
            {item.chiefComplaints && (
              <Text style={styles.patientInfo}>
                Chief Complaints: {item.chiefComplaints}
              </Text>
            )}
            {item.provisionalDiagnosis && (
              <Text style={styles.patientInfo}>
                Provisional Diagnosis: {item.provisionalDiagnosis}
              </Text>
            )}
            {item.miscNotes && (
              <Text style={styles.patientInfo}>
                Misc Notes: {item.miscNotes}
              </Text>
            )}
            <Text style={styles.patientInfo}>Contact: {item.contact}</Text>
          </>
        )}
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.reAdmitButton}
            onPress={() => handleReAdmitPatient(item.registrationNumber)}
          >
            <Text style={styles.buttonText}>Re-admit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditDetails(item.registrationNumber)}
          >
            <Text style={styles.buttonText}>Edit Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewTasksButton}
            onPress={() => handleViewTasks(item.registrationNumber, item.patientName)}
          >
            <Text style={styles.buttonText}>View Tasks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  
  if (!isDbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with toggle button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
          <Text style={styles.toggleButtonText}>
            {viewMode === "simple" ? "Detailed View" : "Simple View"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name or Reg No..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Display error message if any */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Patient List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No discharged patients found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.registrationNumber} 
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end", 
    alignItems: "center",
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#3498db",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  patientCard: {
    backgroundColor: "#ecf0f1",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
  },
  patientInfo: {
    fontSize: 14,
    marginBottom: 4,
    color: "#34495e",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  reAdmitButton: {
    backgroundColor: "#27ae60", 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: "#f1c40f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  viewTasksButton: {
    backgroundColor: "#2980b9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
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
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 18,
    color: "#7f8c8d",
  },
  errorContainer: {
    padding: 8,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
});
