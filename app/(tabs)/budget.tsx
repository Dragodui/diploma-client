import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DollarSign, Plus, Trash } from "lucide-react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { billApi, billCategoryApi } from "@/lib/api";
import { Bill, BillCategory } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";


const DonutChart = ({ data, size = 180, strokeWidth = 20, total, theme }: { data: { value: number; color: string }[]; size?: number; strokeWidth?: number; total: number; theme: any }) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeLength = circumference * percentage;
          const angle = percentage * 360;

          const circle = (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={[strokeLength, circumference]}
              strokeDashoffset={0}
              rotation={currentAngle}
              origin={`${center}, ${center}`}
              strokeLinecap="round"
            />
          );

          currentAngle += angle;
          return circle;
        })}
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontFamily: fonts[700], color: theme.text }}>${total.toFixed(0)}</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts[400], color: theme.textSecondary }}>Total</Text>
      </View>
    </View>
  );
};

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create bill modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newBillAmount, setNewBillAmount] = useState("");
  const [creating, setCreating] = useState(false);

  // Create category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(theme.accent.yellow);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Color options for categories
  const COLOR_OPTIONS = [
    "#FF7476", "#FF9F7A", "#FBEB9E", "#A8E6CF", "#7DD3E8", "#D8D4FC", "#F5A3D3",
    "#22C55E", "#F472B6", "#C4B5FD", "#94A3B8", "#FDE68A", "#6EE7B7",
  ];

  const loadData = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    try {
      const [billsData, categoriesData] = await Promise.all([
        billApi.getByHomeId(home.id).catch(() => []),
        billCategoryApi.getAll(home.id).catch(() => []),
      ]);
      setBills(billsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error loading budget data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!home || !newCategoryName.trim()) return;

    setCreatingCategory(true);
    try {
      await billCategoryApi.create(home.id, {
        name: newCategoryName.trim(),
        color: selectedColor,
      });
      setNewCategoryName("");
      setShowCategoryModal(false);
      await loadData();
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Error", "Could not create category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!home) return;
    Alert.alert(
      "Delete Category?",
      "This will not delete existing bills, but they will lose their category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await billCategoryApi.delete(home.id, categoryId);
              await loadData();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete category.");
            }
          },
        },
      ]
    );
  };

  const handleCreateBill = async () => {
    if (!home || !newBillAmount || !selectedCategoryId) return;

    setCreating(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      const category = categories.find(c => c.id === selectedCategoryId);

      await billApi.create(home.id, {
        type: category?.name || "Expense", // Fallback type
        bill_category_id: selectedCategoryId,
        total_amount: parseFloat(newBillAmount),
        period_start: now.toISOString(),
        period_end: endDate.toISOString(),
        ocr_data: {},
      });

      setNewBillAmount("");
      setSelectedCategoryId(null);
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      console.error("Error creating bill:", error);
      Alert.alert("Error", "Could not create bill.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!home) return;
    Alert.alert("Delete Bill?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await billApi.delete(home.id, billId);
            await loadData();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete bill.");
          }
        },
      },
    ]);
  };

  const getCategoryColor = (categoryId?: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || theme.accent.yellow;
  };

  const getCategoryName = (bill: Bill) => {
    if (bill.bill_category) return bill.bill_category.name;
    const category = categories.find(c => c.id === bill.bill_category_id);
    return category?.name || bill.type;
  };

  const chartData = categories.map(cat => {
    const catBills = bills.filter(b => b.bill_category_id === cat.id);
    const total = catBills.reduce((sum, b) => sum + b.total_amount, 0);
    return {
      value: total,
      color: cat.color || theme.accent.yellow,
      name: cat.name
    };
  }).filter(d => d.value > 0);

  const uncategorizedBills = bills.filter(b => !b.bill_category_id);
  if (uncategorizedBills.length > 0) {
    const total = uncategorizedBills.reduce((sum, b) => sum + b.total_amount, 0);
    chartData.push({
      value: total,
      color: theme.textSecondary,
      name: 'Uncategorized'
    });
  }

  const totalSpend = bills.reduce((sum, b) => sum + b.total_amount, 0);

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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Expenses</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.surface }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={{ fontSize: 12, color: theme.text, fontFamily: fonts[600] }}>+ Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.accent.pink }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {totalSpend > 0 && (
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <DonutChart data={chartData} total={totalSpend} theme={theme} />
          </View>
        )}

        {/* Categories List (Horizontal) */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onLongPress={() => handleDeleteCategory(cat.id)}
              >
                <View style={[styles.categoryDot, { backgroundColor: cat.color || theme.accent.yellow }]} />
                <Text style={[styles.categoryText, { color: theme.text }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            {categories.length === 0 && (
              <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No categories yet</Text>
            )}
          </ScrollView>
        </View>

        {/* Bills List */}
       <View style={styles.billsList}>
  {bills.map((bill) => (
    <View key={bill.id} style={[styles.billCard, { backgroundColor: theme.surface }]}>
      
      <View style={styles.billHeader}>
        
        <View style={[styles.billIcon, { backgroundColor: getCategoryColor(bill.bill_category_id) }]}>
          <DollarSign size={20} color="#1C1C1E" />
        </View>

        <View style={styles.billInfo}>
          <Text style={[styles.billType, { color: theme.text }]}>{getCategoryName(bill)}</Text>
          <Text style={[styles.billDate, { color: theme.textSecondary }]}>
   {new Date(bill.created_at).toLocaleDateString("pl-PL")} {new Date(bill.created_at).toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <Text style={[styles.billAmount, { color: theme.text }]}>
          ${bill.total_amount.toFixed(2)}
        </Text>

        <TouchableOpacity
          onPress={() => handleDeleteBill(bill.id)}
          style={{       
            padding: 1         
          }}
        >
          <Trash size={18} color={theme.accent.pink || "#FF3B30"} />
        </TouchableOpacity>

      </View>
    </View>
  ))}
  
  {bills.length === 0 && (
    <Text style={{ textAlign: "center", color: theme.textSecondary, marginTop: 40 }}>
      No expenses recorded yet.
    </Text>
  )}
</View>
      </ScrollView>

      {/* Create Bill Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Expense"
        height="full"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    selectedCategoryId === cat.id && { borderColor: theme.accent.pink, backgroundColor: theme.accent.pinkLight }
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text style={{ color: theme.text }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input
            label="Amount"
            placeholder="0.00"
            value={newBillAmount}
            onChangeText={setNewBillAmount}
            keyboardType="numeric"
          />

          <Button
            title="Add Expense"
            onPress={handleCreateBill}
            loading={creating}
            disabled={!newBillAmount || !selectedCategoryId}
            variant="pink"
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="New Category"
        height="full"
      >
        <View style={styles.modalContent}>
          <Input
            label="Category Name"
            placeholder="e.g. Groceries, Internet"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  { width: 32, height: 32, borderRadius: 16, backgroundColor: color },
                  selectedColor === color && { borderWidth: 2, borderColor: theme.text }
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Button
            title="Create Category"
            onPress={handleCreateCategory}
            loading={creatingCategory}
            disabled={!newCategoryName.trim()}
            variant="yellow"
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts[700],
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts[700],
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: fonts[600],
    fontSize: 14,
  },
  billsList: {
    gap: 12,
  },
  billCard: {
    padding: 16,
    borderRadius: 16,
  },
  billHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  billInfo: {
    flex: 1,
  },
  billType: {
    fontSize: 16,
    fontFamily: fonts[600],
    marginBottom: 2,
  },
  billDate: {
    fontSize: 12,
  },
  billAmount: {
    fontSize: 18,
    fontFamily: fonts[700],
  },
  modalContent: {
    paddingTop: 10,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts[700],
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  }
});
