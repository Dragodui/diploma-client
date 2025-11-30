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
import { Check, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import { useHome } from "@/contexts/HomeContext";
import { shoppingApi } from "@/lib/api";
import { ShoppingCategory, ShoppingItem } from "@/lib/types";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

const CATEGORY_COLORS = [
  Colors.accentYellow,
  Colors.accentPurple,
  Colors.accentPink,
  Colors.white,
];

const CATEGORY_ICONS = ["cart", "apple", "milk", "bread", "soap", "other"];

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();

  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [items, setItems] = useState<Record<number, ShoppingItem[]>>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Create item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
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

        // Set first category as active if none selected
        if (!activeCategory && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading shopping data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home, activeCategory]);

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
      setSelectedIcon(CATEGORY_ICONS[0]);
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
        category_id: activeCategory,
        name: newItemName.trim(),
        link: newItemLink.trim() || undefined,
      });

      setNewItemName("");
      setNewItemLink("");
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

  const getActiveItems = () => {
    if (!activeCategory) return [];
    return items[activeCategory] || [];
  };

  const getCategoryProgress = (categoryId: number) => {
    const categoryItems = items[categoryId] || [];
    if (categoryItems.length === 0) return { bought: 0, total: 0 };
    const bought = categoryItems.filter((i) => i.is_bought).length;
    return { bought, total: categoryItems.length };
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
            <Text style={styles.title}>Shopping</Text>
            <Text style={styles.subtitle}>Household essentials</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={28} color={Colors.black} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Categories Scroll */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => {
              const progress = getCategoryProgress(category.id);
              const colorIndex = index % CATEGORY_COLORS.length;
              const isActive = activeCategory === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: CATEGORY_COLORS[colorIndex] },
                    isActive && styles.categoryCardActive,
                  ]}
                  onPress={() => setActiveCategory(category.id)}
                  activeOpacity={0.9}
                >
                  <ShoppingBag size={24} color={Colors.black} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryProgress}>
                    {progress.bought}/{progress.total}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Items List */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <ShoppingBag size={48} color={Colors.black} />
            </View>
            <Text style={styles.emptyText}>No categories yet</Text>
            <Text style={styles.emptySubtext}>Create a category to start adding items</Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>
                {categories.find((c) => c.id === activeCategory)?.name || "Items"}
              </Text>
              {activeCategory && (
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setShowItemModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color={Colors.white} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              )}
            </View>

            {getActiveItems().length === 0 ? (
              <View style={styles.emptyItemsContainer}>
                <Text style={styles.emptyItemsText}>No items in this category</Text>
              </View>
            ) : (
              getActiveItems().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, item.is_bought && styles.itemCardBought]}
                  onPress={() => toggleItemBought(item.id)}
                  activeOpacity={0.95}
                >
                  <View style={styles.itemContent}>
                    <View style={[styles.checkbox, item.is_bought && styles.checkboxCompleted]}>
                      {item.is_bought && <Check size={16} color={Colors.black} strokeWidth={4} />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, item.is_bought && styles.itemNameBought]}>
                        {item.name}
                      </Text>
                      {item.link && (
                        <Text style={styles.itemLink} numberOfLines={1}>
                          {item.link}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 size={18} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Category Modal */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="New Category"
      >
        <View style={styles.modalContent}>
          <Input
            label="Category Name"
            placeholder="e.g., Groceries"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            dark
          />

          <View style={styles.iconPicker}>
            <Text style={styles.pickerLabel}>Icon</Text>
            <View style={styles.iconOptions}>
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, selectedIcon === icon && styles.iconOptionActive]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <ShoppingBag size={24} color={selectedIcon === icon ? Colors.black : Colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Create Category"
            onPress={handleCreateCategory}
            loading={creatingCategory}
            disabled={!newCategoryName.trim() || creatingCategory}
            variant="yellow"
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Create Item Modal */}
      <Modal visible={showItemModal} onClose={() => setShowItemModal(false)} title="Add Item">
        <View style={styles.modalContent}>
          <Input
            label="Item Name"
            placeholder="e.g., Milk"
            value={newItemName}
            onChangeText={setNewItemName}
            dark
          />

          <Input
            label="Link (Optional)"
            placeholder="https://..."
            value={newItemLink}
            onChangeText={setNewItemLink}
            keyboardType="url"
            autoCapitalize="none"
            dark
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
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accentYellow,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    marginBottom: 32,
    marginHorizontal: -24,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryCard: {
    width: 120,
    height: 140,
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 3,
    borderColor: "transparent",
  },
  categoryCardActive: {
    borderColor: Colors.black,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  categoryProgress: {
    fontSize: 12,
    fontFamily: fonts[600],
    color: "rgba(0,0,0,0.5)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accentYellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: fonts[700],
    color: Colors.gray400,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
    textAlign: "center",
  },
  itemsContainer: {
    flex: 1,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 24,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addItemText: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: Colors.white,
  },
  emptyItemsContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
  },
  emptyItemsText: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  itemCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  itemCardBought: {
    opacity: 0.5,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gray400,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: Colors.accentPurple,
    borderColor: Colors.accentPurple,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: fonts[600],
    color: Colors.black,
  },
  itemNameBought: {
    textDecorationLine: "line-through",
    color: Colors.gray500,
  },
  itemLink: {
    fontSize: 12,
    fontFamily: fonts[400],
    color: Colors.gray400,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  iconPicker: {
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
  iconOptions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionActive: {
    backgroundColor: Colors.accentYellow,
  },
  modalButton: {
    marginTop: "auto",
  },
});
