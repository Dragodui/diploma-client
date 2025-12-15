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
import {
  ArrowLeft, Check, Plus, Search, Trash2,
  Utensils, Candy, Cake, Apple, ShoppingCart, Coffee,
  Wine, Milk, Beef, Fish, Carrot, Cookie,
  Pill, Baby, Dog, Shirt, Sparkles, Scissors,
  Home, Lightbulb, Wrench, Car, Book, Gift
} from "lucide-react-native";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shoppingApi } from "@/lib/api";
import { ShoppingCategory, ShoppingItem } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

// Category colors matching PDF
const CATEGORY_COLORS = ["#D8D4FC", "#FBEB9E", "#FF7476", "#A8E6CF", "#7DD3E8", "#F5A3D3"];

// Available icons for categories
const ICON_OPTIONS = [
  { id: "utensils", label: "Food" },
  { id: "shopping-cart", label: "Cart" },
  { id: "coffee", label: "Coffee" },
  { id: "wine", label: "Drinks" },
  { id: "milk", label: "Dairy" },
  { id: "beef", label: "Meat" },
  { id: "fish", label: "Fish" },
  { id: "carrot", label: "Veggies" },
  { id: "apple", label: "Fruits" },
  { id: "candy", label: "Sweets" },
  { id: "cake", label: "Bakery" },
  { id: "cookie", label: "Snacks" },
  { id: "pill", label: "Medicine" },
  { id: "baby", label: "Baby" },
  { id: "dog", label: "Pets" },
  { id: "shirt", label: "Clothes" },
  { id: "sparkles", label: "Cleaning" },
  { id: "scissors", label: "Beauty" },
  { id: "home", label: "Home" },
  { id: "lightbulb", label: "Electronics" },
  { id: "wrench", label: "Tools" },
  { id: "car", label: "Auto" },
  { id: "book", label: "Books" },
  { id: "gift", label: "Gifts" },
];

const getIconComponent = (iconId: string, size: number = 24, color: string = "#1C1C1E") => {
  switch (iconId) {
    case "utensils": return <Utensils size={size} color={color} />;
    case "shopping-cart": return <ShoppingCart size={size} color={color} />;
    case "coffee": return <Coffee size={size} color={color} />;
    case "wine": return <Wine size={size} color={color} />;
    case "milk": return <Milk size={size} color={color} />;
    case "beef": return <Beef size={size} color={color} />;
    case "fish": return <Fish size={size} color={color} />;
    case "carrot": return <Carrot size={size} color={color} />;
    case "apple": return <Apple size={size} color={color} />;
    case "candy": return <Candy size={size} color={color} />;
    case "cake": return <Cake size={size} color={color} />;
    case "cookie": return <Cookie size={size} color={color} />;
    case "pill": return <Pill size={size} color={color} />;
    case "baby": return <Baby size={size} color={color} />;
    case "dog": return <Dog size={size} color={color} />;
    case "shirt": return <Shirt size={size} color={color} />;
    case "sparkles": return <Sparkles size={size} color={color} />;
    case "scissors": return <Scissors size={size} color={color} />;
    case "home": return <Home size={size} color={color} />;
    case "lightbulb": return <Lightbulb size={size} color={color} />;
    case "wrench": return <Wrench size={size} color={color} />;
    case "car": return <Car size={size} color={color} />;
    case "book": return <Book size={size} color={color} />;
    case "gift": return <Gift size={size} color={color} />;
    default: return <Utensils size={size} color={color} />;
  }
};

// Color options for creating new lists
const COLOR_OPTIONS = [
  "#FF7476", "#FF9F7A", "#FBEB9E", "#A8E6CF", "#7DD3E8", "#D8D4FC", "#F5A3D3",
  "#22C55E", "#F472B6", "#C4B5FD", "#94A3B8", "#FDE68A", "#6EE7B7",
];

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();
  const { theme } = useTheme();

  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [items, setItems] = useState<Record<number, ShoppingItem[]>>({});
  const [activeCategory, setActiveCategory] = useState<ShoppingCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0].id);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Create item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [creatingItem, setCreatingItem] = useState(false);

  const loadShoppingData = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    try {
      const categoriesData = await shoppingApi.getCategories(home.id);
      setCategories(categoriesData || []);

      if (categoriesData && categoriesData.length > 0) {
        const itemsData: Record<number, ShoppingItem[]> = {};
        for (const category of categoriesData) {
          const categoryItems = await shoppingApi.getCategoryItems(home.id, category.id).catch(() => []);
          itemsData[category.id] = categoryItems || [];
        }
        setItems(itemsData);
      }
    } catch (error) {
      console.error("Error loading shopping data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShoppingData();
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!home || !newCategoryName.trim()) return;

    setCreatingCategory(true);
    try {
      await shoppingApi.createCategory(home.id, {
        name: newCategoryName.trim(),
        icon: selectedIcon,
      });

      setNewCategoryName("");
      setSelectedIcon(ICON_OPTIONS[0].id);
      setSelectedColor(COLOR_OPTIONS[0]);
      setShowCategoryModal(false);
      await loadShoppingData();
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateItem = async () => {
    if (!home || !activeCategory || !newItemName.trim()) return;

    setCreatingItem(true);
    try {
      await shoppingApi.createItem(home.id, {
        category_id: activeCategory.id,
        name: newItemName.trim(),
      });

      setNewItemName("");
      setShowItemModal(false);
      await loadShoppingData();
    } catch (error) {
      console.error("Error creating item:", error);
    } finally {
      setCreatingItem(false);
    }
  };

  const toggleItemBought = async (itemId: number) => {
    if (!home) return;

    try {
      await shoppingApi.markBought(home.id, itemId);
      setItems((prev) => {
        const updated = { ...prev };
        for (const catId in updated) {
          updated[catId] = updated[catId].map((item) =>
            item.id === itemId ? { ...item, is_bought: !item.is_bought } : item
          );
        }
        return updated;
      });
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!home) return;

    try {
      await shoppingApi.deleteItem(home.id, itemId);
      await loadShoppingData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getCategoryIcon = (category: ShoppingCategory) => {
    return getIconComponent(category.icon || "utensils", 24, "#1C1C1E");
  };

  const getActiveItems = () => {
    if (!activeCategory) return [];
    return items[activeCategory.id] || [];
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  // List detail view
  if (activeCategory) {
    const categoryItems = getActiveItems();
    const colorIndex = categories.findIndex((c) => c.id === activeCategory.id) % CATEGORY_COLORS.length;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Detail Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surface }]}
              onPress={() => setActiveCategory(null)}
            >
              <ArrowLeft size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: theme.text }]}>{activeCategory.name}</Text>
            <View style={[styles.detailIcon, { backgroundColor: CATEGORY_COLORS[colorIndex] }]}>
              {getCategoryIcon(activeCategory)}
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsList}>
            {categoryItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleItemBought(item.id)}
                activeOpacity={0.95}
              >
                <View
                  style={[
                    styles.itemCheckbox,
                    { borderColor: theme.textSecondary },
                    item.is_bought && {
                      backgroundColor: theme.accent.purple,
                      borderColor: theme.accent.purple,
                    },
                  ]}
                >
                  {item.is_bought && <Check size={16} color="#1C1C1E" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.itemName,
                    { color: theme.text },
                    item.is_bought && styles.itemNameBought,
                  ]}
                >
                  {item.name}
                </Text>
                {item.is_bought && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Add Item FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent.purple }]}
          onPress={() => setShowItemModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#1C1C1E" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Add Item Modal */}
        <Modal
          visible={showItemModal}
          onClose={() => setShowItemModal(false)}
          title="Add Item"
        >
          <View style={styles.modalContent}>
            <Input
              label="Item Name"
              placeholder="e.g., Milk"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Button
              title="Add Item"
              onPress={handleCreateItem}
              loading={creatingItem}
              disabled={!newItemName.trim() || creatingItem}
              variant="purple"
              style={styles.modalButton}
            />
          </View>
        </Modal>
      </View>
    );
  }

  // Main shopping lists view - matches PDF exactly
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Shopping</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>My Lists</Text>
          </View>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.accent.cyan }]}
            activeOpacity={0.8}
          >
            <Search size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {/* Category Grid - matches PDF layout */}
        <View style={styles.grid}>
          {categories.map((category, index) => {
            const colorIndex = index % CATEGORY_COLORS.length;
            const itemCount = items[category.id]?.length || 0;

            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: CATEGORY_COLORS[colorIndex] }]}
                onPress={() => setActiveCategory(category)}
                activeOpacity={0.9}
              >
                <View style={styles.categoryIconContainer}>
                  {getCategoryIcon(category)}
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{itemCount} Items</Text>
                </View>
                <View style={styles.categoryArrow}>
                  <View style={styles.arrowCircle}>
                    <ArrowLeft
                      size={16}
                      color="rgba(0,0,0,0.3)"
                      style={{ transform: [{ rotate: "180deg" }] }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Add New List Card - Dashed border */}
          <TouchableOpacity
            style={[styles.addCard, { borderColor: theme.textSecondary }]}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={32} color={theme.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Category Modal - matches PDF design */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="New List"
        height="full"
      >
        <View style={styles.modalContent}>
          {/* Icon Preview */}
          <View style={styles.iconPreview}>
            <View style={[styles.iconPreviewCircle, { backgroundColor: selectedColor }]}>
              {getIconComponent(selectedIcon, 32, "#1C1C1E")}
            </View>
          </View>

          {/* Title Input */}
          <Input
            placeholder="Title"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />

          {/* Color Picker */}
          <View style={styles.colorPicker}>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.slice(0, 7).map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.slice(7).map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Icon Picker */}
          <ScrollView style={styles.iconPickerScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.iconPicker}>
              {[0, 1, 2, 3].map((row) => (
                <View key={row} style={styles.iconRow}>
                  {ICON_OPTIONS.slice(row * 6, row * 6 + 6).map((icon) => (
                    <TouchableOpacity
                      key={icon.id}
                      style={[
                        styles.iconOption,
                        { backgroundColor: theme.surface },
                        selectedIcon === icon.id && { backgroundColor: selectedColor },
                      ]}
                      onPress={() => setSelectedIcon(icon.id)}
                    >
                      {getIconComponent(icon.id, 20, selectedIcon === icon.id ? "#1C1C1E" : theme.textSecondary)}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalCancelButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowCategoryModal(false)}
          >
            <ArrowLeft
              size={24}
              color={theme.textSecondary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalConfirmButton,
              { backgroundColor: theme.textSecondary },
              newCategoryName && { backgroundColor: theme.text },
            ]}
            onPress={handleCreateCategory}
            disabled={!newCategoryName.trim() || creatingCategory}
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
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    aspectRatio: 0.9,
    borderRadius: 24,
    padding: 18,
    justifyContent: "space-between",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  categoryName: {
    fontSize: 20,
    fontFamily: fonts[700],
    color: "#1C1C1E",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    fontFamily: fonts[500],
    color: "rgba(0, 0, 0, 0.5)",
  },
  categoryArrow: {
    position: "absolute",
    bottom: 18,
    right: 18,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  addCard: {
    width: "47%",
    aspectRatio: 0.9,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  // Detail view styles
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  detailTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts[700],
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsList: {
    gap: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  itemCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts[600],
  },
  itemNameBought: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalContent: {
    flex: 1,
  },
  iconPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconPreviewCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  colorPicker: {
    marginBottom: 24,
    gap: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "rgba(0, 0, 0, 0.3)",
  },
  iconPickerScroll: {
    maxHeight: 220,
  },
  iconPicker: {
    gap: 12,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
  modalButton: {
    marginTop: "auto",
  },
});
