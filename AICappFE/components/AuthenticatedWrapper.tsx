import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useBudgetValidation } from "../hooks/useBudgetValidation";
import { BudgetSetupModal } from "./BudgetSetupModal";

interface AuthenticatedWrapperProps {
  children: React.ReactNode;
  showBudgetValidation?: boolean;
}

export const AuthenticatedWrapper: React.FC<AuthenticatedWrapperProps> = ({
  children,
  showBudgetValidation = true,
}) => {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const { showBudgetModal, handleBudgetSet } = useBudgetValidation();

  console.log("🏠 AuthenticatedWrapper status:", {
    isLoggedIn,
    authLoading,
    hasUser: !!user,
    userEmail: user?.email,
  });

  // Show loading while checking authentication
  if (authLoading) {
    console.log("⏳ Showing loading...");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login required message if not authenticated
  if (!isLoggedIn) {
    console.log("🚫 Not logged in, showing login message...");
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Please login to continue</Text>
      </View>
    );
  }

  console.log("✅ User authenticated, showing home content...");

  return (
    <>
      {children}

      {/* Budget Setup Modal - only show if budget validation is enabled */}
      {showBudgetValidation && (
        <BudgetSetupModal
          visible={showBudgetModal}
          onBudgetSet={handleBudgetSet}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});
