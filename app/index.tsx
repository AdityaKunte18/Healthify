import { Link } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Router } from "expo-router";
import { useRouter } from "expo-router";

export default function Index() {
  
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    
    const updateDateTime = () => {
      const now = new Date().toLocaleString();
      setCurrentDateTime(now);
    };

    
    updateDateTime();

    
    const intervalId = setInterval(updateDateTime, 1000);

    
    return () => clearInterval(intervalId);
  }, []);

  const router = useRouter();
  const handleAddPatient = () => {
    router.push('/addpatient');
  };

  const handleReviewPatients = () => {
    router.push('/reviewpatients');
  }

  const handlePendingTasks = () => {
    router.push('/pendingtasks');
  }

  const handleReviewOldPatients = () => {
    router.push('/reviewoldpatients');
  }


  const handleReportsToBeCollected = () => {
    router.push('/collectedtasks');
  }

  const handleCompletedTasks = () => {
    router.push('/completedtasks');
  }

  return (
    <View style={styles.container}>
      {/* Date and time in top left */}
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTimeText}>{currentDateTime}</Text>
      </View>

      {/* Patients Section */}
      <Text style={styles.headerText}>Patients</Text>
      <View style={styles.patientButtonsContainer}>

          <TouchableOpacity style={[styles.Patientbutton, { height: 65 }]}
            onPress={handleAddPatient}
          >
            <Text style={styles.buttonText}>Add a new patient +</Text>
          </TouchableOpacity>

        <View style={styles.pendingTasksContainer}>
          <TouchableOpacity style={styles.Patientbutton}
            onPress={handleReviewPatients}
          >
            <Text style={styles.buttonText}>Review current patients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.Patientbutton}
            onPress={handleReviewOldPatients}
          >
            <Text style={styles.buttonText}>Review Discharged patients</Text>
          </TouchableOpacity>
        </View>
       
      </View>

      {/* Tasks Section */}
      <Text style={styles.headerText}>Tasks</Text>
      <View style={styles.tasksContainer}>
        {/* Pending tasks (vertically stacked) */}
        <View style={styles.pendingTasksContainer}>
          <TouchableOpacity style={styles.button}
            onPress={handlePendingTasks}
          >
            <Text style={styles.buttonText}>Pending tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}
            onPress={handleReportsToBeCollected}
          >
            <Text style={styles.buttonText}>Reports to be collected</Text>
          </TouchableOpacity>
        </View>
        {/* Completed tasks (on the same horizontal axis) */}
        <TouchableOpacity
          style={[styles.button, { marginTop: 21, marginRight: 20 }]}
          onPress={handleCompletedTasks}
        >
          <Text style={styles.buttonText}>Completed tasks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  dateTimeContainer: {
    
    
  },
  dateTimeText: {
    fontSize: 20, 
    fontWeight: "bold",
    color: "#333",
    textAlign:'center'
  },
  headerText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#000",
  },
  
  patientButtonsContainer: {
    flexDirection: "row", 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginLeft: 30
  },
  
  tasksContainer: {
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "flex-start", 
  },
  pendingTasksContainer: {
    flexDirection: "column", 
    flex: 1,
    marginRight: 8,
    justifyContent: "space-around",
    padding: 20,
  },
  
  Patientbutton: {
    backgroundColor: "#3498db",
    width: 150,
    height: 65,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8, 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    width: 150,
    borderRadius: 8,
    marginBottom: 8, 
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
