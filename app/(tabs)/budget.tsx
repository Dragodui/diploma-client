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
import { Plus, Receipt, FileText, Camera, Check } from "lucide-react-native";
import { useHome } from "@/contexts/HomeContext";
import { billApi } from "@/lib/api";
import { Bill } from "@/lib/types";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

const BILL_TYPES = [
  { id: "rent", label: "Rent", icon: "home", color: Colors.accentYellow },
  { id: "utilities", label: "Utilities", icon: "zap", color: Colors.accentPurple },
  { id: "internet", label: "Internet", icon: "wifi", color: Colors.accentPink },
  { id: "groceries", label: "Groceries", icon: "shopping-cart", color: Colors.white },
  { id: "other", label: "Other", icon: "file", color: Colors.gray200 },
];

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create bill modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBillType, setNewBillType] = useState("utilities");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const loadBills = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    // Note: The API doesn't have a getAll bills endpoint, so we'd need to track bill IDs
    // For demo purposes, we'll show an empty state or mock data
    setIsLoading(false);
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
      setNewBillType("utilities");
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Budget</Text>
            <Text style={styles.subtitle}>Track your spending</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Camera size={24} color={Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.addButton]}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Spend Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>MONTHLY SPEND</Text>
          <Text style={styles.totalAmount}>${getTotalSpend().toLocaleString()}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "70%" }]} />
            </View>
            <Text style={styles.progressText}>70% of budget</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {BILL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.categoryCard, { backgroundColor: type.color }]}
                activeOpacity={0.9}
              >
                <Receipt size={24} color={Colors.black} />
                <Text style={styles.categoryLabel}>{type.label}</Text>
                <Text style={styles.categoryAmount}>
                  ${(getSpendByCategory()[type.id] || 0).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bills */}
        <View style={styles.billsSection}>
          <Text style={styles.sectionTitle}>Recent Bills</Text>
          {bills.length === 0 ? (
            <View style={styles.emptyBills}>
              <FileText size={48} color={Colors.gray400} />
              <Text style={styles.emptyText}>No bills yet</Text>
              <Text style={styles.emptySubtext}>Add your first bill to start tracking</Text>
            </View>
          ) : (
            bills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billIcon}>
                  <Receipt size={24} color={Colors.black} />
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billType}>{bill.type}</Text>
                  <Text style={styles.billDate}>
                    {new Date(bill.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={styles.billAmount}>${bill.total_amount}</Text>
                  {bill.is_payed && (
                    <View style={styles.paidBadge}>
                      <Check size={12} color={Colors.white} />
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Bill Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Bill"
      >
        <View style={styles.modalContent}>
          <Input
            label="Amount"
            placeholder="0.00"
            value={newBillAmount}
            onChangeText={setNewBillAmount}
            keyboardType="decimal-pad"
            dark
          />

          <View style={styles.typePicker}>
            <Text style={styles.pickerLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeOptions}>
                {BILL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      { backgroundColor: type.color },
                      newBillType === type.id && styles.typeOptionActive,
                    ]}
                    onPress={() => setNewBillType(type.id)}
                  >
                    <Text style={styles.typeOptionText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Button
            title="Add Bill"
            onPress={handleCreateBill}
            loading={creating}
            disabled={!newBillAmount || creating}
            variant="pink"
            style={styles.modalButton}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: Colors.accentPink,
  },
  totalCard: {
    backgroundColor: Colors.black,
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
    letterSpacing: 2,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 48,
    fontFamily: fonts[800],
    color: Colors.white,
    marginBottom: 24,
  },
  progressContainer: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray700,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accentPink,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: Colors.gray400,
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: Colors.black,
  },
  categoryAmount: {
    fontSize: 24,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  billsSection: {
    flex: 1,
  },
  emptyBills: {
    backgroundColor: Colors.gray50,
    borderRadius: 24,
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts[700],
    color: Colors.gray400,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  billCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.accentYellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  billInfo: {
    flex: 1,
  },
  billType: {
    fontSize: 16,
    fontFamily: fonts[600],
    color: Colors.black,
    textTransform: "capitalize",
  },
  billDate: {
    fontSize: 12,
    fontFamily: fonts[400],
    color: Colors.gray400,
    marginTop: 4,
  },
  billRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  billAmount: {
    fontSize: 18,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  paidBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.green500,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  typePicker: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeOptionActive: {
    borderColor: Colors.black,
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: Colors.black,
  },
  modalButton: {
    marginTop: "auto",
  },
});
