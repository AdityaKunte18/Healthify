

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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDatabase } from "../context/DatabaseContext";
import { useIsFocused } from "@react-navigation/native"; 
import { formatToIST } from "../utils/dateUtils"; 

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
 * Interface representing a Consultation item from the consultations table.
 */
interface ConsultationItem {
  consult: string;
  dateTime: string; 
  task_status: string;
}

/**
 * Interface representing a Consultation item from the oldconsultations table.
 */
interface OldConsultationItem {
  consult: string;
  dateTime: string; 
  task_status: string;
}

/**
 * Interface representing a section in the SectionList.
 */
interface SectionData {
  title: string;
  data: (TaskItem | OldTaskItem | ConsultationItem | OldConsultationItem)[];
  hasStatus: boolean; 
  isConsultation?: boolean; 
  isOldConsultation?: boolean; 
}

/**
 * ViewTasks component displays the tasks related to a specific patient.
 */
export default function ViewTasks() {
  
  const { registrationNumber, patientName } = useLocalSearchParams<{
    registrationNumber: string;
    patientName: string;
  }>();
  const { db, isDbInitialized } = useDatabase();
  const router = useRouter();
  const isFocused = useIsFocused(); 

  const [currentLabs, setCurrentLabs] = useState<TaskItem[]>([]);
  const [currentImaging, setCurrentImaging] = useState<TaskItem[]>([]);
  const [oldLabs, setOldLabs] = useState<OldTaskItem[]>([]);
  const [oldImaging, setOldImaging] = useState<OldTaskItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [oldConsultations, setOldConsultations] = useState<OldConsultationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      isDbInitialized &&
      db &&
      registrationNumber &&
      patientName && 
      isFocused
    ) {
      fetchTasks();
    }
  }, [isDbInitialized, db, registrationNumber, patientName, isFocused]);

  /**
   * Fetch all related tasks and consultations for the patient.
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);

      
      const fetchedCurrentLabs = await db.getAllAsync<TaskItem>(
        "SELECT lab_type AS type, lab_subtype AS subtype, task_status AS task_status, date_and_time AS dateTime FROM tasks WHERE registrationNumber = ? AND lab_type IS NOT NULL AND lab_subtype IS NOT NULL",
        [registrationNumber]
      );
      setCurrentLabs(fetchedCurrentLabs);

      
      const fetchedCurrentImaging = await db.getAllAsync<TaskItem>(
        "SELECT imaging_type AS type, imaging_subtype AS subtype, task_status AS task_status, date_and_time AS dateTime FROM tasks WHERE registrationNumber = ? AND imaging_type IS NOT NULL AND imaging_subtype IS NOT NULL",
        [registrationNumber]
      );
      setCurrentImaging(fetchedCurrentImaging);

      
      const fetchedOldLabs = await db.getAllAsync<OldTaskItem>(
        "SELECT lab_type AS type, lab_subtype AS subtype, date_and_time AS dateTime FROM oldlabs WHERE registrationNumber = ? AND lab_type IS NOT NULL AND lab_subtype IS NOT NULL",
        [registrationNumber]
      );
      setOldLabs(fetchedOldLabs);

      
      const fetchedOldImaging = await db.getAllAsync<OldTaskItem>(
        "SELECT imaging_type AS type, imaging_subtype AS subtype, date_and_time AS dateTime FROM oldlabs WHERE registrationNumber = ? AND imaging_type IS NOT NULL AND imaging_subtype IS NOT NULL",
        [registrationNumber]
      );
      setOldImaging(fetchedOldImaging);

      
      const fetchedConsultations = await db.getAllAsync<ConsultationItem>(
        "SELECT consult, date_and_time AS dateTime, task_status AS task_status FROM consultations WHERE registrationNumber = ? AND consult IS NOT NULL",
        [registrationNumber]
      );
      setConsultations(fetchedConsultations);

      
      const fetchedOldConsultations = await db.getAllAsync<OldConsultationItem>(
        "SELECT consult, date_and_time AS dateTime, task_status AS task_status FROM oldconsultations WHERE registrationNumber = ? AND consult IS NOT NULL",
        [registrationNumber]
      );
      setOldConsultations(fetchedOldConsultations);

      setError(null);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle deletion of a task or consultation item.
   * @param table - The table name ('tasks', 'oldlabs', 'consultations', 'oldconsultations').
   * @param item - The task or consultation item to delete.
   */
  const handleDelete = (table: string, item: TaskItem | OldTaskItem | ConsultationItem | OldConsultationItem) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteItem(table, item),
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Delete the task or consultation item from the database.
   * @param table - The table name ('tasks', 'oldlabs', 'consultations', 'oldconsultations').
   * @param item - The task or consultation item to delete.
   */
  const deleteItem = async (
    table: string,
    item: TaskItem | OldTaskItem | ConsultationItem | OldConsultationItem
  ) => {
    try {
      setLoading(true);
      let query = "";
      let params: any[] = [];

      switch (table) {
        case "tasks":
          const taskItem = item as TaskItem;
          query = `
            DELETE FROM tasks 
            WHERE registrationNumber = ? 
              AND date_and_time = ? 
              AND (
                (lab_type = ? AND lab_subtype = ?) OR 
                (imaging_type = ? AND imaging_subtype = ?)
              )
          `;
          params = [
            registrationNumber,
            taskItem.dateTime,
            taskItem.type,
            taskItem.subtype,
            taskItem.type,
            taskItem.subtype,
          ];
          break;

        case "oldlabs":
          const oldTaskItem = item as OldTaskItem;
          query = `
            DELETE FROM oldlabs 
            WHERE registrationNumber = ? 
              AND date_and_time = ? 
              AND (
                (lab_type = ? AND lab_subtype = ?) OR 
                (imaging_type = ? AND imaging_subtype = ?)
              )
          `;
          params = [
            registrationNumber,
            oldTaskItem.dateTime,
            oldTaskItem.type,
            oldTaskItem.subtype,
            oldTaskItem.type,
            oldTaskItem.subtype,
          ];
          break;

        case "consultations":
          const consultationItem = item as ConsultationItem;
          query = `
            DELETE FROM consultations 
            WHERE registrationNumber = ? 
              AND consult = ? 
              AND date_and_time = ?
          `;
          params = [
            registrationNumber,
            consultationItem.consult,
            consultationItem.dateTime,
          ];
          break;

        case "oldconsultations":
          const oldConsultationItem = item as OldConsultationItem;
          query = `
            DELETE FROM oldconsultations 
            WHERE registrationNumber = ? 
              AND consult = ? 
              AND date_and_time = ?
          `;
          params = [
            registrationNumber,
            oldConsultationItem.consult,
            oldConsultationItem.dateTime,
          ];
          break;

        default:
          throw new Error("Invalid table name.");
      }

      await db.runAsync(query, params);
      Alert.alert("Success", "Item deleted successfully.");
      fetchTasks(); 
    } catch (err) {
      console.error("Error deleting item:", err);
      Alert.alert("Error", "Failed to delete the item.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle editing of a task or consultation item.
   * @param table - The table name ('tasks', 'oldlabs', 'consultations', 'oldconsultations').
   * @param item - The task or consultation item to edit.
   */
  const handleEdit = (
    table: string,
    item: TaskItem | OldTaskItem | ConsultationItem | OldConsultationItem
  ) => {
    router.push({
      pathname: "/edittask", 
      params: {
        registrationNumber: registrationNumber,
        date_and_time: "dateTime" in item ? item.dateTime : undefined,
        type: "type" in item ? item.type : undefined,
        subtype: "subtype" in item ? item.subtype : undefined,
        consult: "consult" in item ? item.consult : undefined,
        table: table,
        task_status: "task_status" in item ? (item as TaskItem).task_status : undefined,
      },
    });
  };

  /**
   * Render a single current task item (with status and dateTime).
   */
  const renderCurrentTaskItem = ({ item }: { item: TaskItem }) => {
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskType}>Type: {item.type}</Text>
        <Text style={styles.taskSubtype}>Subtype: {item.subtype}</Text>
        <Text style={styles.taskStatus}>Status: {item.task_status}</Text>
        <Text style={styles.taskDateTime}>Date & Time: {formatToIST(item.dateTime)}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete("tasks", item)}
          >
            <Text style={styles.buttonText}>Delete Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit("tasks", item)}
          >
            <Text style={styles.buttonText}>Edit Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render a single old task item (without status but with dateTime).
   */
  const renderOldTaskItem = ({ item }: { item: OldTaskItem }) => {
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskType}>Type: {item.type}</Text>
        <Text style={styles.taskSubtype}>Subtype: {item.subtype}</Text>
        <Text style={styles.taskDateTime}>Date & Time: {formatToIST(item.dateTime)}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete("oldlabs", item)}
          >
            <Text style={styles.buttonText}>Delete Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit("oldlabs", item)}
          >
            <Text style={styles.buttonText}>Edit Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render a single consultation item (with consult and dateTime).
   */
  const renderConsultationItem = ({ item }: { item: ConsultationItem }) => {
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskType}>Consultation: {item.consult}</Text>
        <Text style={styles.taskType}>Task Status: {item.task_status}</Text>
        <Text style={styles.taskDateTime}>Date & Time: {formatToIST(item.dateTime)}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete("consultations", item)}
          >
            <Text style={styles.buttonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render a single old consultation item (with consult and dateTime).
   */
  const renderOldConsultationItem = ({ item }: { item: OldConsultationItem }) => {
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskType}>Consultation: {item.consult}</Text>
        <Text style={styles.taskType}>Task Status: {item.task_status}</Text>
        <Text style={styles.taskDateTime}>Date & Time: {formatToIST(item.dateTime)}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete("oldconsultations", item)}
          >
            <Text style={styles.buttonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      title: "Current Labs",
      data: currentLabs,
      hasStatus: true,
    },
    {
      title: "Current Imaging",
      data: currentImaging,
      hasStatus: true,
    },
    {
      title: "Consultations",
      data: consultations,
      hasStatus: false,
      isConsultation: true,
    },
    {
      title: "Old Labs",
      data: oldLabs,
      hasStatus: false,
    },
    {
      title: "Old Imaging",
      data: oldImaging,
      hasStatus: false,
    },
    {
      title: "Old Consultations",
      data: oldConsultations,
      hasStatus: false,
      isOldConsultation: true,
    },
  ];

  /**
   * Render each item based on its section.
   */
  const renderItem = ({
    item,
    section,
  }: {
    item: TaskItem | OldTaskItem | ConsultationItem | OldConsultationItem;
    section: SectionData;
  }) => {
    if (section.isConsultation && "consult" in item) {
      return renderConsultationItem({ item: item as ConsultationItem });
    } else if (section.isOldConsultation && "consult" in item) {
      return renderOldConsultationItem({ item: item as OldConsultationItem });
    } else if (section.hasStatus && "task_status" in item) {
      return renderCurrentTaskItem({ item: item as TaskItem });
    } else {
      return renderOldTaskItem({ item: item as OldTaskItem });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
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
      {/* Header displaying Patient Name and Registration Number */}
      <View style={styles.patientHeader}>
        <Text style={styles.patientNameText}>Patient Name: {patientName}</Text>
        <Text style={styles.registrationNumberText}>
          Registration Number: {registrationNumber}
        </Text>
      </View>

      {/* Add More Tasks Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push({
            pathname: "/addtasks",
            params: { registrationNumber, patientName }, 
          })
        }
      >
        <Text style={styles.addButtonText}>Add More Tasks</Text>
      </TouchableOpacity>

      {/* SectionList for Tasks and Consultations */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => {
          
          if ("task_status" in item) {
            return `${item.type}-${item.subtype}-${item.dateTime}-${index}`;
          } else if ("consult" in item) {
            return `${item.consult}-${item.dateTime}-${index}`;
          } else {
            return `${item.type}-${item.subtype}-${item.dateTime}-${index}`;
          }
        }}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.noDataText}>No tasks found.</Text>}
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
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  patientHeader: {
    backgroundColor: "#dfe6e9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  patientNameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  registrationNumberText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  addButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2980b9",
    marginBottom: 12,
    marginTop: 16,
  },
  taskItem: {
    backgroundColor: "#ecf0f1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskType: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 4,
  },
  taskSubtype: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 4,
  },
  taskDateTime: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    marginRight: 3,
  },
  editButton: {
    backgroundColor: "#2980b9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
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
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
