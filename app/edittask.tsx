

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; 
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDatabase } from "../context/DatabaseContext";
import { useIsFocused } from "@react-navigation/native";

/**
 * Interface representing a Task item from the tasks table.
 */
interface TaskItem {
  type: string; 
  subtype: string; 
  task_status: "unsent" | "sent" | "collected"; 
  dateTime: string; 
}

/**
 * Interface representing a Task item from the oldlabs table.
 */
interface OldTaskItem {
  type: string; 
  subtype: string; 
  dateTime: string; 
}

/**
 * Interface representing the possible task categories.
 */
type TaskCategory = "currentLab" | "currentImaging" | "oldLab" | "oldImaging";

/**
 * EditTask component allows users to edit the subtype and task_status of a task.
 */
export default function EditTask() {
  
  const {
    registrationNumber,
    date_and_time,
    type,
    subtype: initialSubtype,
    table,
    task_status,
  } = useLocalSearchParams<{
    registrationNumber: string;
    date_and_time: string;
    type: string; 
    subtype: string; 
    table: "tasks" | "oldlabs"; 
    task_status?: "unsent" | "sent" | "collected"; 
  }>();

  const { db, isDbInitialized } = useDatabase();
  const router = useRouter();
  const isFocused = useIsFocused();

  
  const determineCategory = (): TaskCategory | null => {
    if (table === "tasks") {
      if (["blood", "urine", "miscellanous"].includes(type.toLowerCase())) {
        return "currentLab";
      } else if (["x-ray", "ct", "mri", "usg"].includes(type.toLowerCase())) {
        return "currentImaging";
      }
    } else if (table === "oldlabs") {
      if (["blood", "urine", "miscellanous"].includes(type.toLowerCase())) {
        return "oldLab";
      } else if (["x-ray", "ct", "mri", "usg"].includes(type.toLowerCase())) {
        return "oldImaging";
      }
    }
    return null;
  };

  const [category, setCategory] = useState<TaskCategory | null>(null);

  
  const [subtype, setSubtype] = useState<string>("");
  const [status, setStatus] = useState<"unsent" | "sent" | "collected">("unsent"); 

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (isDbInitialized && isFocused) {
      const determinedCategory = determineCategory();
      setCategory(determinedCategory);
      if (determinedCategory) {
        setSubtype(initialSubtype || "");
        if (
          (determinedCategory === "currentLab" ||
            determinedCategory === "currentImaging") &&
          task_status
        ) {
          setStatus(task_status);
        }
      } else {
        setError("Invalid task parameters.");
      }
    }
  }, [
    isDbInitialized,
    isFocused,
    registrationNumber,
    date_and_time,
    type,
    initialSubtype,
    table,
    task_status,
  ]);

  /**
   * Handle form submission to update the task.
   */
  const handleSubmit = async () => {
    if (!category) {
      Alert.alert("Error", "Invalid task category.");
      return;
    }

    if (!subtype.trim()) {
      Alert.alert("Validation Error", "Subtype cannot be empty.");
      return;
    }

    try {
      setLoading(true);

      if (category === "currentLab" || category === "currentImaging") {
        
        const query = `
          UPDATE tasks 
          SET ${category.includes("Lab") ? "lab_subtype" : "imaging_subtype"} = ?, 
              task_status = ?
          WHERE registrationNumber = ? 
            AND date_and_time = ? 
            AND ${category.includes("Lab") ? "lab_type" : "imaging_type"} = ?
        `;
        const params = [
          subtype.trim(),
          status,
          registrationNumber,
          date_and_time,
          type,
        ];
        await db.runAsync(query, params);
      } else if (category === "oldLab" || category === "oldImaging") {
        
        const query = `
          UPDATE oldlabs 
          SET ${category.includes("Lab") ? "lab_subtype" : "imaging_subtype"} = ?
          WHERE registrationNumber = ? 
            AND date_and_time = ? 
            AND ${category.includes("Lab") ? "lab_type" : "imaging_type"} = ?
        `;
        const params = [
          subtype.trim(),
          registrationNumber,
          date_and_time,
          type,
        ];
        await db.runAsync(query, params);
      }

      Alert.alert("Success", "Task updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(), 
        },
      ]);
    } catch (err) {
      console.error("Error updating task:", err);
      Alert.alert("Error", "Failed to update the task.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render different form fields based on the category.
   */
  const renderFormFields = () => {
    if (!category) return null;

    return (
      <View style={styles.formContainer}>
        {/* Subtype Field */}
        <Text style={styles.label}>Subtype:</Text>
        <TextInput
          style={styles.input}
          value={subtype}
          onChangeText={setSubtype}
          placeholder="Enter Subtype"
        />

        {/* Task Status Field (only for current tasks) */}
        {(category === "currentLab" || category === "currentImaging") && (
          <>
            <Text style={styles.label}>Task Status:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={status}
                style={styles.picker}
                onValueChange={(itemValue) =>
                  setStatus(itemValue as "unsent" | "sent" | "collected")
                }
              >
                <Picker.Item label="Unsent" value="unsent" />
                <Picker.Item label="Sent" value="sent" />
                <Picker.Item label="Collected" value="collected" />
              </Picker>
            </View>
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Task</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render error message if any.
   */
  const renderError = () => {
    if (!error) return null;
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  /**
   * Render loading indicator.
   */
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Updating task...</Text>
      </View>
    );
  };

  /**
   * Optional: Helper function to determine if the type is Lab or Imaging
   */
  const isLabType = (type: string): boolean => {
    return ["blood", "urine", "miscellanous"].includes(type.toLowerCase());
  };

  const isImagingType = (type: string): boolean => {
    return ["x-ray", "ct", "mri", "usg"].includes(type.toLowerCase());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Task</Text>
      </View>

      {/* Error Message */}
      {renderError()}

      {/* Loading Indicator */}
      {loading && renderLoading()}

      {/* Form Fields */}
      {!loading && renderFormFields()}
    </View>
  );
}

/**
 * Styles for the EditTask component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  formContainer: {
    backgroundColor: "#ecf0f1",
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 40,
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
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#2980b9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#34495e",
  },
  errorContainer: {
    padding: 12,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
