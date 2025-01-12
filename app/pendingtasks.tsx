

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDatabase } from "../context/DatabaseContext";
import { useIsFocused } from "@react-navigation/native"; 
import { formatToIST } from "../utils/dateUtils"; 

/**
 * Interface representing a Lab item.
 */
interface LabItem {
  registrationNumber: string;
  patientName: string;
  lab_type: string;
  lab_subtype: string;
  dateTime: string; 
}

/**
 * Interface representing an Imaging item.
 */
interface ImagingItem {
  registrationNumber: string;
  patientName: string;
  imaging_type: string;
  imaging_subtype: string;
  dateTime: string; 
}

/**
 * Interface representing a Consultation item.
 */
interface ConsultationItem {
  registrationNumber: string;
  patientName: string;
  consult: string;
  dateTime: string; 
}

/**
 * Interface representing an Old Consultation item.
 */
interface OldConsultationItem {
  registrationNumber: string;
  patientName: string;
  consult: string;
  dateTime: string; 
}

/**
 * Interface representing a section in the SectionList.
 */
interface SectionData {
  title: string;
  data: any[]; 
}

/**
 * PendingTasks component displays pending tasks categorized into Labs, Imaging, Consultations, and Old Consultations.
 */
export default function PendingTasks() {
  const { db, isDbInitialized } = useDatabase();
  const router = useRouter();
  const isFocused = useIsFocused();

  const [labs, setLabs] = useState<LabItem[]>([]);
  const [imaging, setImaging] = useState<ImagingItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [oldConsultations, setOldConsultations] = useState<OldConsultationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDbInitialized && db && isFocused) {
      fetchPendingTasks();
    }
  }, [isDbInitialized, db, isFocused]);

  /**
   * Fetch all pending tasks from the database.
   */
  const fetchPendingTasks = async () => {
    try {
      setLoading(true);

      
      const fetchedLabs = await db.getAllAsync<LabItem>(
        `
        SELECT 
          t.registrationNumber, 
          p.patientName, 
          t.lab_type, 
          t.lab_subtype, 
          t.date_and_time AS dateTime
        FROM tasks t
        JOIN patients p ON t.registrationNumber = p.registrationNumber
        WHERE t.lab_type IS NOT NULL 
          AND t.lab_subtype IS NOT NULL
          AND t.task_status = 'unsent'
        ORDER BY t.date_and_time ASC
        `,
        []
      );
      setLabs(fetchedLabs);

      
      const fetchedImaging = await db.getAllAsync<ImagingItem>(
        `
        SELECT 
          t.registrationNumber, 
          p.patientName, 
          t.imaging_type, 
          t.imaging_subtype, 
          t.date_and_time AS dateTime
        FROM tasks t
        JOIN patients p ON t.registrationNumber = p.registrationNumber
        WHERE t.imaging_type IS NOT NULL 
          AND t.imaging_subtype IS NOT NULL
          AND t.task_status = 'unsent'
        ORDER BY t.date_and_time ASC
        `,
        []
      );
      setImaging(fetchedImaging);

      
      const fetchedConsultations = await db.getAllAsync<ConsultationItem>(
        `
        SELECT 
          c.registrationNumber, 
          p.patientName, 
          c.consult, 
          c.date_and_time AS dateTime
        FROM consultations c
        JOIN patients p ON c.registrationNumber = p.registrationNumber
        WHERE c.task_status = 'unsent'
        ORDER BY c.date_and_time ASC
        `,
        []
      );
      setConsultations(fetchedConsultations);

      
      const fetchedOldConsultations = await db.getAllAsync<OldConsultationItem>(
        `
        SELECT 
          oc.registrationNumber, 
          p.patientName, 
          oc.consult, 
          oc.date_and_time AS dateTime
        FROM oldconsultations oc
        JOIN patients p ON oc.registrationNumber = p.registrationNumber
        WHERE oc.task_status = 'unsent'
        ORDER BY oc.date_and_time ASC
        `,
        []
      );
      setOldConsultations(fetchedOldConsultations);

      setError(null);
    } catch (err) {
      console.error("Error fetching pending tasks:", err);
      setError("Failed to load pending tasks.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark a task as sent.
   * @param taskType The type of task ('Lab', 'Imaging', 'Consultation', 'OldConsultation')
   * @param identifier An object containing the fields required to identify the task
   */
  const markTaskAsSent = async (
    taskType: string,
    identifier: Record<string, any>
  ) => {
    try {
      let query = "";
      let params: any[] = [];

      switch (taskType) {
        case "Lab":
          query = `
            UPDATE tasks
            SET task_status = 'sent'
            WHERE registrationNumber = ? 
              AND date_and_time = ?
              AND lab_type = ?
              AND lab_subtype = ?
          `;
          params = [
            identifier.registrationNumber,
            identifier.dateTime,
            identifier.lab_type,
            identifier.lab_subtype,
          ];
          break;
        case "Imaging":
          query = `
            UPDATE tasks
            SET task_status = 'sent'
            WHERE registrationNumber = ? 
              AND date_and_time = ?
              AND imaging_type = ?
              AND imaging_subtype = ?
          `;
          params = [
            identifier.registrationNumber,
            identifier.dateTime,
            identifier.imaging_type,
            identifier.imaging_subtype,
          ];
          break;
        case "Consultation":
          query = `
            UPDATE consultations
            SET task_status = 'sent'
            WHERE registrationNumber = ? 
              AND date_and_time = ?
              AND consult = ?
          `;
          params = [
            identifier.registrationNumber,
            identifier.dateTime,
            identifier.consult,
          ];
          break;
        case "OldConsultation":
          query = `
            UPDATE oldconsultations
            SET task_status = 'sent'
            WHERE registrationNumber = ? 
              AND date_and_time = ?
              AND consult = ?
          `;
          params = [
            identifier.registrationNumber,
            identifier.dateTime,
            identifier.consult,
          ];
          break;
        default:
          throw new Error("Invalid task type");
      }

      await db.runAsync(query, ...params);
      Alert.alert("Success", "Task marked as sent.");
      fetchPendingTasks();
    } catch (err) {
      console.error(`Error marking ${taskType} as sent:`, err);
      Alert.alert("Error", `Failed to mark ${taskType} as sent.`);
    }
  };

  /**
   * Delete a task.
   * @param taskType The type of task ('Lab', 'Imaging', 'Consultation', 'OldConsultation')
   * @param identifier An object containing the fields required to identify the task
   */
  const deleteTask = async (
    taskType: string,
    identifier: Record<string, any>
  ) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this task?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              let query = "";
              let params: any[] = [];

              switch (taskType) {
                case "Lab":
                  query = `
                    DELETE FROM tasks
                    WHERE registrationNumber = ? 
                      AND date_and_time = ?
                      AND lab_type = ?
                      AND lab_subtype = ?
                  `;
                  params = [
                    identifier.registrationNumber,
                    identifier.dateTime,
                    identifier.lab_type,
                    identifier.lab_subtype,
                  ];
                  break;
                case "Imaging":
                  query = `
                    DELETE FROM tasks
                    WHERE registrationNumber = ? 
                      AND date_and_time = ?
                      AND imaging_type = ?
                      AND imaging_subtype = ?
                  `;
                  params = [
                    identifier.registrationNumber,
                    identifier.dateTime,
                    identifier.imaging_type,
                    identifier.imaging_subtype,
                  ];
                  break;
                case "Consultation":
                  query = `
                    DELETE FROM consultations
                    WHERE registrationNumber = ? 
                      AND date_and_time = ?
                      AND consult = ?
                  `;
                  params = [
                    identifier.registrationNumber,
                    identifier.dateTime,
                    identifier.consult,
                  ];
                  break;
                case "OldConsultation":
                  query = `
                    DELETE FROM oldconsultations
                    WHERE registrationNumber = ? 
                      AND date_and_time = ?
                      AND consult = ?
                  `;
                  params = [
                    identifier.registrationNumber,
                    identifier.dateTime,
                    identifier.consult,
                  ];
                  break;
                default:
                  throw new Error("Invalid task type");
              }

              await db.runAsync(query, ...params);
              Alert.alert("Success", "Task deleted successfully.");
              fetchPendingTasks();
            } catch (err) {
              console.error(`Error deleting ${taskType}:`, err);
              Alert.alert("Error", `Failed to delete ${taskType}.`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Edit a task by navigating to the /edittasks route with required parameters.
   * @param taskType The type of task ('Lab', 'Imaging')
   * @param identifier An object containing the fields required to identify the task
   */
  const editTask = (taskType: string, identifier: Record<string, any>) => {
    const params: Record<string, string> = {
      registrationNumber: identifier.registrationNumber,
      date_and_time: identifier.dateTime,
      type: taskType === "Lab" ? identifier.lab_type : identifier.imaging_type,
      subtype: taskType === "Lab" ? identifier.lab_subtype : identifier.imaging_subtype,
      table: "tasks",
      task_status: "unsent",
    };

    
    router.push({
      pathname: "/edittask",
      params: params,
    });
  };

  /**
   * Render action buttons for each item.
   * Includes 'Mark as Sent', 'Delete Task', and 'Edit Task' for Labs and Imaging.
   * @param taskType The type of task ('Lab', 'Imaging', 'Consultation', 'OldConsultation')
   * @param identifier An object containing the fields required to identify the task
   */
  const renderActionButtons = (
    taskType: string,
    identifier: Record<string, any>
  ) => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.markSentButton}
        onPress={() => markTaskAsSent(taskType, identifier)}
      >
        <Text style={styles.buttonText}>Mark as Sent</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTask(taskType, identifier)}
      >
        <Text style={styles.buttonText}>Delete Task</Text>
      </TouchableOpacity>
      {/* Add 'Edit Task' button only for Labs and Imaging */}
      {(taskType === "Lab" || taskType === "Imaging") && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editTask(taskType, identifier)}
        >
          <Text style={styles.buttonText}>Edit Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Render a single Lab item.
   */
  const renderLabItem = ({ item }: { item: LabItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Registration Number:</Text> {item.registrationNumber}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Patient Name:</Text> {item.patientName}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Lab Type:</Text> {item.lab_type}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Lab Subtype:</Text> {item.lab_subtype}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Date & Time:</Text> {formatToIST(item.dateTime)}
      </Text>
      {renderActionButtons("Lab", {
        registrationNumber: item.registrationNumber,
        dateTime: item.dateTime,
        lab_type: item.lab_type,
        lab_subtype: item.lab_subtype,
      })}
    </View>
  );

  /**
   * Render a single Imaging item.
   */
  const renderImagingItem = ({ item }: { item: ImagingItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Registration Number:</Text> {item.registrationNumber}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Patient Name:</Text> {item.patientName}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Imaging Type:</Text> {item.imaging_type}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Imaging Subtype:</Text> {item.imaging_subtype}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Date & Time:</Text> {formatToIST(item.dateTime)}
      </Text>
      {renderActionButtons("Imaging", {
        registrationNumber: item.registrationNumber,
        dateTime: item.dateTime,
        imaging_type: item.imaging_type,
        imaging_subtype: item.imaging_subtype,
      })}
    </View>
  );

  /**
   * Render a single Consultation item.
   */
  const renderConsultationItem = ({ item }: { item: ConsultationItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Registration Number:</Text> {item.registrationNumber}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Patient Name:</Text> {item.patientName}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Consultation:</Text> {item.consult}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Date & Time:</Text> {formatToIST(item.dateTime)}
      </Text>
      {renderActionButtons("Consultation", {
        registrationNumber: item.registrationNumber,
        dateTime: item.dateTime,
        consult: item.consult,
      })}
    </View>
  );

  /**
   * Render a single Old Consultation item.
   */
  const renderOldConsultationItem = ({ item }: { item: OldConsultationItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Registration Number:</Text> {item.registrationNumber}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Patient Name:</Text> {item.patientName}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Consultation:</Text> {item.consult}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.boldText}>Date & Time:</Text> {formatToIST(item.dateTime)}
      </Text>
      {renderActionButtons("OldConsultation", {
        registrationNumber: item.registrationNumber,
        dateTime: item.dateTime,
        consult: item.consult,
      })}
    </View>
  );

  /**
   * Render a section header.
   */
  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  /**
   * Prepare sections data for SectionList.
   */
  const sections: SectionData[] = [
    {
      title: "Labs",
      data: labs,
    },
    {
      title: "Imaging",
      data: imaging,
    },
    {
      title: "Consultations",
      data: consultations,
    },
    {
      title: "Old Consultations",
      data: oldConsultations,
    },
  ];

  /**
   * Render each item based on its section.
   */
  const renderItem = ({ item, section }: { item: any; section: SectionData }) => {
    switch (section.title) {
      case "Labs":
        return renderLabItem({ item: item as LabItem });
      case "Imaging":
        return renderImagingItem({ item: item as ImagingItem });
      case "Consultations":
        return renderConsultationItem({ item: item as ConsultationItem });
      case "Old Consultations":
        return renderOldConsultationItem({ item: item as OldConsultationItem });
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading pending tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.registrationNumber}-${item.dateTime}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.noDataText}>No pending tasks found.</Text>}
        contentContainerStyle={
          sections.every(section => section.data.length === 0) && styles.emptyContainer
        }
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: "#3498db",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2980b9",
    marginTop: 16,
    marginBottom: 8,
  },
  itemContainer: {
    backgroundColor: "#ecf0f1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 4,
  },
  boldText: {
    fontWeight: "bold",
  },
  separator: {
    height: 12,
  },
  noDataText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#34495e",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-start",
  },
  markSentButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#c0392b",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: "#2980b9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
