import React, { useState } from 'react';
import './AddRecipe.css';
import { recipeService } from '../../services/recipeService';
import Notification from '../Notification/Notification';
import SearchableSelect from './SearchableSelect';

const INGREDIENT_OPTIONS = [
  'ARLA BARISTA FULL CREAM MILK',
  'ARLA FULL CREAM MILK',
  'BACON',
  'BEEF TAPA',
  'BISCOFF PEANUT BUTTER',
  'BISCOFF PLAIN BISCUITS',
  'BROWN SUGAR',
  'CAESAR SALAD DRESSING',
  'CHICKEN QUARTER',
  'CHORIZO',
  'COFFEE BEANS (ARABICA)',
  'COFFEE BEANS (ROBUSTA)',
  'CONDENSED MILK',
  'COOKING OIL',
  'CORNSTARCH',
  'CRISPY FRY',
  'CUCUMBER',
  'DRINKING WATER',
  'EDEN CHEESE',
  'EGG',
  'EMBORG FULL CREAM MILK',
  'EVAPORATED MILK',
  'FLOUR',
  'GARLIC POWDER',
  'GINGER POWDER',
  'GROUND PEPPER',
  'HEAVY WHIPPING CREAM (ANCHOR)',
  'HEAVY WHIPPING CREAM (ARLA)',
  'HEAVY WHIPPING CREAM (BUNGEE)',
  'HEAVY WHIPPING CREAM (EMBORG)',
  'ICE CUBES',
  'IODIZED SALT',
  'JAJANGMYEON',
  'JIN RAMEN',
  'KIWI SYRUP',
  'LETTUCE',
  'LONGANISA',
  'MATCHA POWDER (LITTLE RETAIL)',
  'MONIN CARAMEL SAUCE',
  'MONIN SYRUP VANILLA',
  'MORINGA POWDER',
  'NUTELLA SPREAD',
  'OATMILK',
  'ONION POWDER',
  'OYSTER SAUCE',
  'PARMESAN CHEESE POWDER',
  'PASSIONFRUIT SYRUP',
  'PORK TOCINO',
  'RICE',
  'SESAME SEEDS',
  'SHIN RAMEN',
  'SOY SAUCE',
  'SPAM',
  'SPRITE (MISMO)',
  'STARBUCKS ESPRESSO ROAST',
  'STRAWBERRY SYRUP',
  'SUGAR SYRUP',
  'SWEETENED PEANUT BUTTER',
  'TABLEA',
  'TOMATO',
  'TORANI SYRUP CARAMEL',
  'TORANI SYRUP HAZELNUT',
  'TORANI SYRUP VANILLA',
  'TORANI WHITE CHOCOLATE SAUCE',
  'UNSWEETENED COCOA POWDER',
  'WHITE CHOCOLATE CHIPS',
  'WHITE SUGAR'
];

const BEVERAGE_CATEGORIES = ['Coffee', 'Non-Coffee'];

const RECIPE_OPTIONS = {
  'Coffee': [
    { name: 'CAPPUCCINO', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'CARAMEL MACCHIATO', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'SPANISH LATTE', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'HAZELNUT LATTE', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'MOCHA', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'WHITE CHOCOLATE MOCHA', sizes: ['8oz', '12oz', '16oz'] },
    { name: 'SEA SALT CREAM LATTE', sizes: ['12oz', '16oz'] },
    { name: 'CARAMEL CREAM LATTE', sizes: ['12oz', '16oz'] },
    { name: 'PEANUT CREAM LATTE', sizes: ['12oz', '16oz'] },
    { name: 'HAZELNUT NUTELLA LATTE', sizes: ['12oz', '16oz'] },
    { name: 'BISCOFF CREAM LATTE', sizes: ['12oz', '16oz'] },
  ],
  'Non-Coffee': [
    { name: 'ICEY CHOCO', sizes: ['12oz', '16oz'] },
    { name: 'CHOCOLATE CREAM CLOUD', sizes: ['12oz', '16oz'] },
    { name: 'CHOCOLATE SEASALT CLOUD', sizes: ['12oz', '16oz'] },
    { name: 'MATCHA CLOUD', sizes: ['12oz', '16oz'] },
    { name: 'MATCHA SEASALT CLOUD', sizes: ['12oz', '16oz'] },
    { name: 'MORINGA MATCHA LATTE', sizes: ['12oz', '16oz'] },
    { name: 'MORINGA LATTE', sizes: ['12oz', '16oz'] },
    { name: 'MATCHA LATTE', sizes: ['12oz', '16oz'] },
    { name: 'SIGNATURE HOT CHOCOLATE', sizes: ['8oz', '12oz'] },
    { name: 'SIGNATURE TABLEA', sizes: ['8oz', '12oz'] },
    { name: 'TABLEA CON CREMA', sizes: ['8oz', '12oz'] },
    { name: 'SIKWATE CON CREMA', sizes: ['8oz', '12oz'] },
  ],
  'Food': [
    { name: 'COUNTRY SIDE CHICKEN' },
    { name: 'BACON AND EGG' },
    { name: 'SPAM AND EGG' },
    { name: 'SPAM MUSUBI' },
    { name: 'CHORIZO WITH EGG' },
    { name: 'BEEF TAPA AND EGG' },
    { name: 'TOCINO AND EGG' },
    { name: 'LONGANISA AND EGG' },
    { name: 'EGG TUNA' },
    { name: 'REGULAR RAMEN' },
    { name: 'ROSE SHIN' },
    { name: 'CHEESE RAMYEON' },
    { name: 'JAJANGMYEON' },
  ]
};

const PACKAGING_OPTIONS = [
  'DW PAPER CUP 12oz w/lid',
  'DW PAPER CUP 8oz w/lid',
  'SC PET 95-12oz CUP w/lid',
  'PET 95-16oz Y CUP w/lid',
  'PLASTIC STRAW',
  'WOODEN STIRRER',
  'PLASTIC BAG (DOUBLE)',
  'TABLE NAPKIN',
  'TAKE OUT PAPER CONTAINER',
  'PLASTIC CONTAINER'
];

const AddRecipe = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    recipeName: '',
    category: '',
    size: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    packaging: [{ name: '', quantity: '', unit: '' }]
  });

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredientField = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }]
    }));
  };

  const removeIngredientField = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handlePackagingChange = (index, field, value) => {
    const newPackaging = [...formData.packaging];
    newPackaging[index] = {
      ...newPackaging[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      packaging: newPackaging
    }));
  };

  const addPackagingField = () => {
    setFormData(prev => ({
      ...prev,
      packaging: [...prev.packaging, { name: '', quantity: '', unit: '' }]
    }));
  };

  const removePackagingField = (index) => {
    setFormData(prev => ({
      ...prev,
      packaging: prev.packaging.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await recipeService.addRecipe(formData);
      showNotification('success', 'Recipe added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error adding recipe:', error);
      showNotification('error', 'Failed to add recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.recipeName || !formData.category) {
      showNotification('error', 'Please fill in all required fields');
      return false;
    }
    if (!formData.ingredients.every(ing => ing.name && ing.quantity && ing.unit)) {
      showNotification('error', 'Please complete all ingredient fields');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      recipeName: '',
      category: '',
      size: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      packaging: [{ name: '', quantity: '', unit: '' }]
    });
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="add-recipe-container">
      <div className="form-header">
        <h1>Add New Recipe</h1>
      </div>

      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value,
                recipeName: '',
                size: ''
              }))}
              disabled={loading}
              required
            >
              <option value="">Select Category</option>
              <option value="Coffee">Coffee</option>
              <option value="Non-Coffee">Non-Coffee</option>
              <option value="Food">Food</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="recipeName">Recipe Name*</label>
            <select
              type="text"
              id="recipeName"
              value={formData.recipeName}
              onChange={(e) => {
                const selectedRecipe = RECIPE_OPTIONS[formData.category]?.find(r => r.name === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  recipeName: e.target.value,
                  size: selectedRecipe?.sizes?.[0] || ''
                }));
              }}
              disabled={loading || !formData.category}
              required
            >
              <option value="">Select Recipe</option>
              {RECIPE_OPTIONS[formData.category]?.map(recipe => (
                <option key={recipe.name} value={recipe.name}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </div>

          {BEVERAGE_CATEGORIES.includes(formData.category) && formData.recipeName && (
            <div className="form-group">
              <label htmlFor="size">Size*</label>
              <select
                id="size"
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                disabled={loading}
                required
              >
                <option value="">Select Size</option>
                {RECIPE_OPTIONS[formData.category]
                  ?.find(r => r.name === formData.recipeName)
                  ?.sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>

        <div className="ingredients-section">
          <h3>Ingredients*</h3>
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-row">
              <div className="form-group">
                <SearchableSelect
                  options={INGREDIENT_OPTIONS}
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  placeholder="Search ingredient..."
                  name="ingredientName"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-group">
                <select
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Unit</option>
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="L">Liters (L)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="tbsp">Tablespoon (tbsp)</option>
                  <option value="tsp">Teaspoon (tsp)</option>
                </select>
              </div>
              {formData.ingredients.length > 1 && (
                <button
                  type="button"
                  className="remove-ingredient"
                  onClick={() => removeIngredientField(index)}
                  disabled={loading}
                >
                  <span className="material-icons">remove_circle</span>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-ingredient"
            onClick={addIngredientField}
            disabled={loading}
          >
            <span className="material-icons">add_circle</span>
            Add Ingredient
          </button>
        </div>

        <div className="packaging-section">
          <h3>Packaging & Supplies*</h3>
          {formData.packaging.map((item, index) => (
            <div key={index} className="packaging-row">
              <div className="form-group">
                <SearchableSelect
                  options={PACKAGING_OPTIONS}
                  value={item.name}
                  onChange={(e) => handlePackagingChange(index, 'name', e.target.value)}
                  placeholder="Search packaging..."
                  name="packagingName"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handlePackagingChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-group">
                <select
                  value={item.unit}
                  onChange={(e) => handlePackagingChange(index, 'unit', e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              {formData.packaging.length > 1 && (
                <button
                  type="button"
                  className="remove-packaging"
                  onClick={() => removePackagingField(index)}
                  disabled={loading}
                >
                  <span className="material-icons">remove_circle</span>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-packaging"
            onClick={addPackagingField}
            disabled={loading}
          >
            <span className="material-icons">add_circle</span>
            Add Packaging
          </button>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            <span className="material-icons">add</span>
            {loading ? 'Adding...' : 'Add Recipe'}
          </button>
        </div>
      </form>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AddRecipe; 