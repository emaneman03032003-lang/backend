const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  description: { 
    type: String 
  }
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  image: { 
    type: String 
  },
  description: { 
    type: String 
  },
  subcategories: [subcategorySchema],
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
}, { timestamps: true });

// Auto-generate slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }
  next();
});

// Auto-generate subcategory slugs
categorySchema.pre('save', function(next) {
  if (this.subcategories && this.subcategories.length > 0) {
    this.subcategories.forEach(sub => {
      if (sub.name && !sub.slug) {
        sub.slug = sub.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '')
          .replace(/-+/g, '-');
      }
    });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
