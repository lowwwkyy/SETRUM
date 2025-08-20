import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BudgetService } from "../services/BudgetService";

interface BudgetSetupModalProps {
  visible: boolean;
  onBudgetSet: () => void;
  onClose?: () => void;
}

export const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  visible,
  onBudgetSet,
  onClose,
}) => {
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetBudget = async () => {
    if (!budgetAmount.trim()) {
      Alert.alert("Error", "Please enter a budget amount");
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    setIsLoading(true);
    try {
      await BudgetService.createBudget(amount);
      Alert.alert("Success", "Budget has been set successfully!", [
        {
          text: "OK",
          onPress: () => {
            setBudgetAmount("");
            onBudgetSet();
          },
        },
      ]);
    } catch (error) {
      console.error("Error setting budget:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to set budget"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except dots
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    return numericValue;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setBudgetAmount(formatted);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        // Prevent modal from being closed until budget is set
        // Only close if onClose prop is provided (for testing purposes)
        if (onClose) {
          onClose();
        }
      }}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Monthly Budget</Text>
            <Text style={styles.subtitle}>
              Please set your monthly electricity budget to start using the app
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Monthly Budget (IDR)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <TextInput
                style={styles.input}
                value={budgetAmount}
                onChangeText={handleAmountChange}
                placeholder="0"
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSetBudget}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Set Budget</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            You can change this budget later in the settings
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 380,
    minHeight: 300,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E1E5E9",
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#333",
    padding: 0,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  note: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
  },
});
