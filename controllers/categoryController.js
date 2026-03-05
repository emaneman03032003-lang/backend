const Category = require('../models/Category');
const Product = require('../models/Product');

// ============================================
// CATEGORY OPERATIONS
// ============================================

// Add new category with subcategories
exports.addCategory = async (req, res) => {
  try {
    const { name, image, description, status, subcategories } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }

    const categoryData = {
      name: name.trim(),
      image: image || '',
      description: description || '',
      status: status === 'inactive' ? 'inactive' : 'active',
      subcategories: Array.isArray(subcategories) ? subcategories.filter(s => s.name && s.name.trim()) : []
    };

    const category = await Category.create(categoryData);

    return res.status(201).json({ 
      success: true, 
      data: category,
      message: 'Category created successfully' 
    });
  } catch (error) {
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0] || 'unknown';
      return res.status(400).json({ 
        success: false, 
        error: `Category ${field} already exists`
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add category',
      message: error.message 
    });
  }
};

// Get all categories (admin - all categories including inactive)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();
    
    return res.json({ 
      success: true, 
      categories: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('❌ getAllCategories error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
};

// Get only active categories (frontend)
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 }).lean();

    return res.json({ 
      success: true, 
      categories: categories
    });
  } catch (error) {
    console.error('❌ getActiveCategories error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch active categories' 
    });
  }
};

// Get single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    return res.json({ 
      success: true, 
      category: category
    });
  } catch (error) {
    console.error('❌ getCategoryById error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch category' 
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description, status, subcategories } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    // Check if new name conflicts with existing category (excluding current)
    if (name && name !== category.name) {
      const duplicate = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Category name already exists' 
        });
      }

      // Update products with old category name
      const oldName = category.name;
      await Product.updateMany(
        { category: oldName }, 
        { $set: { category: name.trim() } }
      );
    }

    // Update category fields
    category.name = name ? name.trim() : category.name;
    category.image = image !== undefined ? image : category.image;
    category.description = description !== undefined ? description : category.description;
    category.status = status || category.status;
    
    // Update subcategories
    if (Array.isArray(subcategories)) {
      category.subcategories = subcategories.filter(s => s.name && s.name.trim());
    }

    const updated = await category.save();

    return res.json({ 
      success: true, 
      data: updated,
      message: 'Category updated successfully' 
    });
  } catch (error) {
    console.error('❌ updateCategory error:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category name already exists' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update category',
      message: error.message 
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    const categoryName = category.name;
    
    // Delete category
    await Category.findByIdAndDelete(id);

    // Update products: set uncategorized
    await Product.updateMany(
      { category: categoryName }, 
      { $set: { category: 'Uncategorized' } }
    );

    return res.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('❌ deleteCategory error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete category',
      message: error.message 
    });
  }
};

// ============================================
// SUBCATEGORY OPERATIONS
// ============================================

// Add subcategory to category
exports.addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Subcategory name is required' 
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    // Check duplicate subcategory name
    const duplicate = category.subcategories.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subcategory already exists in this category' 
      });
    }

    category.subcategories.push({
      name: name.trim(),
      description: description || ''
    });

    const updated = await category.save();

    return res.status(201).json({ 
      success: true, 
      data: updated,
      message: 'Subcategory added successfully' 
    });
  } catch (error) {
    console.error('❌ addSubcategory error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add subcategory',
      message: error.message 
    });
  }
};

// Update subcategory
exports.updateSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subcategory not found' 
      });
    }

    // Check duplicate name (excluding current)
    if (name && name !== subcategory.name) {
      const duplicate = category.subcategories.find(
        s => s._id.toString() !== subcategoryId && s.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Subcategory name already exists' 
        });
      }
    }

    subcategory.name = name ? name.trim() : subcategory.name;
    subcategory.description = description !== undefined ? description : subcategory.description;

    const updated = await category.save();

    return res.json({ 
      success: true, 
      data: updated,
      message: 'Subcategory updated successfully' 
    });
  } catch (error) {
    console.error('❌ updateSubcategory error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update subcategory',
      message: error.message 
    });
  }
};

// Delete subcategory
exports.deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subcategory not found' 
      });
    }

    subcategory.deleteOne();
    const updated = await category.save();

    return res.json({ 
      success: true, 
      category: updated,
      message: 'Subcategory deleted successfully' 
    });
  } catch (error) {
    console.error('❌ deleteSubcategory error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete subcategory',
      message: error.message 
    });
  }
};
