import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, ShoppingCart, Wifi, X, Check, DollarSign } from "lucide-react-native";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { billApi } from "@/lib/api";
import { Bill } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const BILL_TYPES = [
  { id: "groceries", label: "Groceries", color: "#FF7476" },
  { id: "internet", label: "Internet", color: "#D8D4FC" },
  { id: "utilities", label: "Utilities", color: "#FBEB9E" },
  { id: "rent", label: "Rent", color: "#FBEB9E" },
  { id: "other", label: "Other", color: "#A8E6CF" },
];

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();
  const { theme } = useTheme();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create bill modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBillType, setNewBillType] = useState("groceries");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDescription, setNewBillDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadBills = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    try {
      const billsData = await billApi.getByHomeId(home.id).catch(() => []);
      setBills(billsData || []);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const handleCreateBill = async () => {
    if (!home || !newBillAmount) return;

    setCreating(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await billApi.create(home.id, {
        type: newBillType,
        total_amount: parseFloat(newBillAmount),
        period_start: now.toISOString(),
        period_end: endDate.toISOString(),
      });

      setNewBillAmount("");
      setNewBillType("groceries");
      setNewBillDescription("");
      setShowCreateModal(false);
      await loadBills();
    } catch (error) {
      console.error("Error creating bill:", error);
    } finally {
      setCreating(false);
    }
  };

  const getTotalSpend = () => {
    return bills.reduce((sum, bill) => sum + bill.total_amount, 0);
  };

  const getSpendByCategory = () => {
    const categories: Record<string, number> = {};
    bills.forEach((bill) => {
      categories[bill.type] = (categories[bill.type] || 0) + bill.total_amount;
    });
    return categories;
  };

  const getBillIcon = (type: string) => {
    switch (type) {
      case "groceries":
        return <ShoppingCart size={22} color="#1C1C1E" />;
      case "internet":
        return <Wifi size={22} color="#1C1C1E" />;
      default:
        return <DollarSign size={22} color="#1C1C1E" />;
    }
  };

  const getBillIconBg = (type: string) => {
    const billType = BILL_TYPES.find((t) => t.id === type);
    return billType?.color || "#D8D4FC";
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matches PDF exactly */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Expences</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{getCurrentMonth()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: theme.accent.yellow }]}
            activeOpacity={0.8}
          >
            <Calendar size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {/* Donut Chart Card - matches PDF */}
        <Card variant="surface" borderRadius={32} padding={32} style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {/* Simplified donut chart visualization */}
            <View style={styles.donutOuter}>
              <View style={[styles.donutSegmentYellow, { transform: [{ rotate: "0deg" }] }]} />
              <View style={[styles.donutSegmentPurple, { transform: [{ rotate: "200deg" }] }]} />
              <View style={[styles.donutSegmentPink, { transform: [{ rotate: "280deg" }] }]} />
              <View style={styles.donutInner}>
                <Text style={styles.donutLabel}>TOTAL</Text>
                <Text style={styles.donutAmount}>${getTotalSpend().toLocaleString() || "3,232"}</Text>
              </View>
            </View>
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FBEB9E" }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Rent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#D8D4FC" }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Utilities</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FF7476" }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Groceries</Text>
            </View>
          </View>
        </Card>

        {/* Add Expense Button */}
        <Button
          title="Add Expense"
          onPress={() => setShowCreateModal(true)}
          variant="purple"
          style={styles.addButton}
        />

        {/* Recent Transactions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>

        {bills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No expenses yet</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {bills.slice(0, 5).map((bill) => (
              <Card
                key={bill.id}
                variant="surface"
                borderRadius={24}
                padding={16}
                style={styles.transactionCard}
              >
                <View style={styles.transactionContent}>
                  <View style={[styles.transactionIcon, { backgroundColor: getBillIconBg(bill.type) }]}>
                    {getBillIcon(bill.type)}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionTitle, { color: theme.text }]}>
                      {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}
                    </Text>
                    <Text style={[styles.transactionMeta, { color: theme.textSecondary }]}>
                      {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)} • Paid by Alex
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: theme.text }]}>
                    -${bill.total_amount}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Expense Modal - matches PDF design */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Expense"
      >
        <View style={styles.modalContent}>
          {/* Amount Input - Large centered */}
          <Card variant="surface" borderRadius={24} padding={24} style={styles.amountCard}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollarSign}>$</Text>
              <Input
                placeholder="0"
                value={newBillAmount}
                onChangeText={setNewBillAmount}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
          </Card>

          {/* Description */}
          <Input
            label="Description"
            placeholder="e.g. Weekly Groceries"
            value={newBillDescription}
            onChangeText={setNewBillDescription}
          />

          {/* Category Picker */}
          <View style={styles.categoryPicker}>
            <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryOptions}>
                {BILL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: theme.surface },
                      newBillType === type.id && { backgroundColor: type.color },
                    ]}
                    onPress={() => setNewBillType(type.id)}
                  >
                    {getBillIcon(type.id)}
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { color: theme.textSecondary },
                        newBillType === type.id && { color: "#1C1C1E" },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Paid By */}
          <View style={styles.paidByPicker}>
            <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>PAID BY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.paidByOptions}>
                {["Me", "Mike", "John Pork", "Daniel"].map((person, index) => (
                  <TouchableOpacity
                    key={person}
                    style={[
                      styles.paidByOption,
                      { borderColor: theme.border },
                      index === 0 && { backgroundColor: theme.text, borderColor: theme.text },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paidByOptionText,
                        { color: theme.textSecondary },
                        index === 0 && { color: theme.background },
                      ]}
                    >
                      {person}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalCancelButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowCreateModal(false)}
          >
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalConfirmButton,
              { backgroundColor: theme.textSecondary },
              newBillAmount && { backgroundColor: theme.text },
            ]}
            onPress={handleCreateBill}
            disabled={!newBillAmount || creating}
          >
            <Check size={24} color={theme.background} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts[700],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts[400],
  },
  calendarButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  chartCard: {
    marginBottom: 16,
    alignItems: "center",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  donutOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutSegmentYellow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 20,
    borderColor: "transparent",
    borderTopColor: "#FBEB9E",
    borderRightColor: "#FBEB9E",
  },
  donutSegmentPurple: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 20,
    borderColor: "transparent",
    borderTopColor: "#D8D4FC",
  },
  donutSegmentPink: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 20,
    borderColor: "transparent",
    borderTopColor: "#FF7476",
  },
  donutInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  donutLabel: {
    fontSize: 11,
    fontFamily: fonts[600],
    color: "#8E8E93",
    letterSpacing: 1,
    marginBottom: 4,
  },
  donutAmount: {
    fontSize: 28,
    fontFamily: fonts[800],
    color: "#FFFFFF",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontFamily: fonts[500],
  },
  addButton: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts[700],
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts[400],
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    marginBottom: 0,
  },
  transactionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 18,
    fontFamily: fonts[700],
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    fontFamily: fonts[500],
  },
  transactionAmount: {
    fontSize: 18,
    fontFamily: fonts[700],
  },
  modalContent: {
    flex: 1,
  },
  amountCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: fonts[600],
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dollarSign: {
    fontSize: 32,
    fontFamily: fonts[700],
    color: "#FF7476",
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: fonts[800],
    backgroundColor: "transparent",
    borderWidth: 0,
    height: "auto",
    padding: 0,
  },
  categoryPicker: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  categoryOptions: {
    flexDirection: "row",
    gap: 12,
  },
  categoryOption: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
    minWidth: 70,
  },
  categoryOptionText: {
    fontSize: 11,
    fontFamily: fonts[600],
  },
  paidByPicker: {
    marginBottom: 24,
  },
  paidByOptions: {
    flexDirection: "row",
    gap: 10,
  },
  paidByOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paidByOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  modalCancelButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
