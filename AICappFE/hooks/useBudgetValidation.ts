import { useState, useEffect, useCallback } from "react";
import { BudgetService, Budget } from "../services/BudgetService";
import { useAuth } from "./useAuth";

export const useBudgetValidation = () => {
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const { isLoggedIn } = useAuth();

  const checkBudgetStatus = useCallback(async () => {
    console.log("💰 Checking budget status...", { isLoggedIn });

    if (!isLoggedIn) {
      console.log("❌ Not logged in, skipping budget check");
      setHasBudget(null);
      setBudget(null);
      setIsLoading(false);
      setShowBudgetModal(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔍 Fetching user budget...");

      const userBudget = await BudgetService.getUserBudget();

      if (userBudget) {
        console.log("✅ Budget found:", {
          id: userBudget._id,
          amount: userBudget.amount,
        });
        setHasBudget(true);
        setBudget(userBudget);
        setShowBudgetModal(false);
      } else {
        console.log("❌ No budget found, showing modal");
        setHasBudget(false);
        setBudget(null);
        setShowBudgetModal(true);
      }
    } catch (error) {
      console.error("❌ Error checking budget status:", error);
      setHasBudget(false);
      setBudget(null);
      setShowBudgetModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    checkBudgetStatus();
  }, [checkBudgetStatus]);

  const refreshBudgetStatus = () => {
    checkBudgetStatus();
  };

  const handleBudgetSet = () => {
    setShowBudgetModal(false);
    refreshBudgetStatus();
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
  };

  return {
    hasBudget,
    budget,
    isLoading,
    showBudgetModal,
    refreshBudgetStatus,
    handleBudgetSet,
    closeBudgetModal,
  };
};
