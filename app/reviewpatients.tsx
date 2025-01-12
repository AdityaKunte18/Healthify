

import React, { useState, useEffect, useMemo } from "react";
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
import { formatDateToIST } from "../utils/dateUtils"; 

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
 * ReviewPatients component allows users to view a list of patients
 * in either 'simple' or 'detailed' view modes with search functionality.
 */
export default function ReviewPatients() {
  const { db, isDbInitialized } = useDatabase();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isFocused = useIsFocused(); 

  
  const LOCATIONS: Array<Patient["location"]> = [
    "Emergency",
    "ICU",
    "HDU",
    "Ward Male",
    "Ward Female",
    "Other",
  ];

  useEffect(() => {
    if (isDbInitialized && db && isFocused) {
      fetchPatients();
    }
  }, [isDbInitialized, db, isFocused]); 

  /**
   * Fetch all patients from the database with is_discharged = 0, sorted by reg_date descending.
   */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const fetchedPatients = await db.getAllAsync<Patient>(
        "SELECT * FROM patients WHERE is_discharged = 0 ORDER BY reg_date DESC"
      );
      setPatients(fetchedPatients);
      setFilteredPatients(fetchedPatients);
      setError(null);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compute the count of patients per location.
   */
  const locationCounts = useMemo(() => {
    const counts: { [key in Patient["location"]]: number } = {
      Emergency: 0,
      ICU: 0,
      HDU: 0,
      "Ward Male": 0,
      "Ward Female": 0,
      Other: 0,
    };
    patients.forEach((patient) => {
      counts[patient.location] += 1;
    });
    return counts;
  }, [patients]);

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
   * Handle discharging a patient by updating is_discharged to 1.
   * @param registrationNumber - The registration number of the patient to discharge.
   */
  const handleDischargePatient = async (registrationNumber: string) => {
    Alert.alert(
      "Confirm Discharge",
      `Are you sure you want to discharge patient with Registration Number: ${registrationNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discharge", style: "destructive", onPress: () => discharge(registrationNumber) },
      ]
    );
  };

  /**
   * Perform the discharge operation.
   * @param registrationNumber - The registration number of the patient to discharge.
   */
  const discharge = async (registrationNumber: string) => {
    try {
      setLoading(true);
      await db.runAsync(
        "UPDATE patients SET is_discharged = 1 WHERE registrationNumber = ?",
        [registrationNumber]
      );
      setError(null);
      Alert.alert("Success", "Patient discharged successfully.", [
        { text: "OK" },
      ]);
      fetchPatients(); 
    } catch (err) {
      console.error("Error discharging patient:", err);
      setError("Failed to discharge patient.");
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
          Date of Admission:{formatDateToIST(item.reg_date)}
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
            style={styles.dischargeButton}
            onPress={() => handleDischargePatient(item.registrationNumber)}
          >
            <Text style={styles.buttonText}>Discharge</Text>
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
      {/* Location Counts */}
      <View style={styles.locationCountsContainer}>
        {LOCATIONS.map((loc) => (
          <View key={loc} style={styles.locationCountItem}>
            <Text style={styles.locationName}>{loc}</Text>
            <Text style={styles.locationCount}>{locationCounts[loc]}</Text>
          </View>
        ))}
      </View>

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
          accessibilityLabel="Search Input"
          accessibilityHint="Search patients by name or registration number"
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
          <Text style={styles.noDataText}>No patients found.</Text>
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
  },
  locationCountsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 8, 
    borderRadius: 8,
  },
  locationCountItem: {
    width: "30%", 
    backgroundColor: "#ecf0f1",
    padding: 6, 
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  locationName: {
    fontSize: 12, 
    color: "#2c3e50",
    marginBottom: 2, 
    fontWeight: "600",
  },
  locationCount: {
    fontSize: 14, 
    color: "#27ae60",
    fontWeight: "bold",
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
  dischargeButton: {
    backgroundColor: "#e74c3c", 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    width: 102,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#f1c40f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  viewTasksButton: {
    backgroundColor: "#2980b9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#34495e",
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
