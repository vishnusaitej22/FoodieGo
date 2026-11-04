-- =====================================================================
-- FoodieGo | Seed 002: DEMONSTRATION DATA
-- All restaurants are FICTIONAL. Ratings and delivery times are demo values.
-- Safe to run more than once (it skips rows that already exist).
-- =====================================================================

-- Prevents duplicate dishes if this file is run twice
create unique index if not exists menu_items_restaurant_name_uniq
  on public.menu_items (restaurant_id, name);

-- ---------- Categories ----------
insert into public.food_categories (name, slug, emoji, sort_order) values
  ('Biryani',      'biryani',      '🍛', 1),
  ('Pizza',        'pizza',        '🍕', 2),
  ('Burgers',      'burgers',      '🍔', 3),
  ('South Indian', 'south-indian', '🥞', 4),
  ('North Indian', 'north-indian', '🍲', 5),
  ('Desserts',     'desserts',     '🍰', 6),
  ('Beverages',    'beverages',    '🥤', 7)
on conflict (slug) do nothing;

-- ---------- Restaurants (fictional demo data) ----------
insert into public.restaurants
  (name, slug, description, cuisines, rating, delivery_minutes, min_order, delivery_fee, is_veg, offer_text, is_demo)
values
  ('Spice Route Biryani', 'spice-route-biryani',
   'Slow-cooked dum biryani and Indian classics. (Fictional demo restaurant)',
   array['Biryani','North Indian'], 4.5, 35, 199, 30, false, '20% OFF up to ₹100', true),
  ('Tiffin Corner', 'tiffin-corner',
   'Fresh idli, vada and filter coffee all day. (Fictional demo restaurant)',
   array['South Indian','Beverages'], 4.4, 25, 99, 0, true, null, true),
  ('Slice of Napoli', 'slice-of-napoli',
   'Hand-tossed pizzas with generous toppings. (Fictional demo restaurant)',
   array['Pizza','Desserts'], 4.2, 40, 249, 40, false, 'Free delivery', true),
  ('Burger Barn', 'burger-barn',
   'Juicy burgers, crispy fries and thick shakes. (Fictional demo restaurant)',
   array['Burgers','Beverages'], 4.1, 30, 149, 25, false, null, true),
  ('Dosa Darbar', 'dosa-darbar',
   'Crispy dosas and comforting South Indian breakfasts. (Fictional demo restaurant)',
   array['South Indian'], 4.6, 28, 129, 0, true, '₹50 OFF above ₹299', true),
  ('Tandoor Tales', 'tandoor-tales',
   'Smoky tandoori kebabs and rich curries. (Fictional demo restaurant)',
   array['North Indian','Beverages'], 4.3, 45, 299, 45, false, null, true),
  ('Sweet Tooth Studio', 'sweet-tooth-studio',
   'Indian sweets, cakes and chilled drinks. (Fictional demo restaurant)',
   array['Desserts','Beverages'], 4.7, 30, 149, 30, true, null, true),
  ('Green Bowl Kitchen', 'green-bowl-kitchen',
   'Light, wholesome vegetarian bowls and meals. (Fictional demo restaurant)',
   array['North Indian','Beverages'], 4.0, 35, 179, 35, true, null, true)
on conflict (slug) do nothing;

-- ---------- Menu items (prices in INR) ----------
insert into public.menu_items (restaurant_id, category_id, name, description, price, is_veg)
select r.id, c.id, v.name, v.description, v.price, v.is_veg
from (values
  -- Spice Route Biryani
  ('spice-route-biryani','biryani','Hyderabadi Chicken Dum Biryani','Basmati rice slow-cooked with spiced chicken',289,false),
  ('spice-route-biryani','biryani','Mutton Biryani','Tender mutton layered with fragrant rice',389,false),
  ('spice-route-biryani','biryani','Paneer Tikka Biryani','Grilled paneer with saffron rice',249,true),
  ('spice-route-biryani','biryani','Veg Dum Biryani','Mixed vegetables and aromatic rice',199,true),
  ('spice-route-biryani','north-indian','Chicken 65','Spicy deep-fried chicken bites',189,false),
  ('spice-route-biryani','north-indian','Mirchi Ka Salan','Tangy peanut and sesame curry with chillies',79,true),
  ('spice-route-biryani','desserts','Gulab Jamun (2 pcs)','Warm milk dumplings in sugar syrup',99,true),
  ('spice-route-biryani','beverages','Masala Soda','Fizzy lime soda with spices',59,true),
  -- Tiffin Corner
  ('tiffin-corner','south-indian','Idli (3 pcs)','Steamed rice cakes with sambar and chutney',60,true),
  ('tiffin-corner','south-indian','Medu Vada (2 pcs)','Crispy lentil doughnuts',70,true),
  ('tiffin-corner','south-indian','Ghee Podi Idli','Idli tossed in spicy gunpowder and ghee',90,true),
  ('tiffin-corner','south-indian','Masala Dosa','Crispy dosa with potato filling',110,true),
  ('tiffin-corner','south-indian','Ven Pongal','Rice and lentil porridge with pepper and ghee',90,true),
  ('tiffin-corner','beverages','Filter Coffee','Strong South Indian filter coffee',40,true),
  -- Slice of Napoli
  ('slice-of-napoli','pizza','Margherita Pizza','Tomato, mozzarella and fresh basil',249,true),
  ('slice-of-napoli','pizza','Farmhouse Pizza','Onion, capsicum, tomato and mushroom',329,true),
  ('slice-of-napoli','pizza','Pepperoni Pizza','Classic pepperoni and mozzarella',379,false),
  ('slice-of-napoli','pizza','BBQ Chicken Pizza','Smoky barbecue chicken with onions',399,false),
  ('slice-of-napoli','pizza','Garlic Breadsticks','Baked breadsticks with garlic butter',149,true),
  ('slice-of-napoli','desserts','Chocolate Lava Cake','Warm cake with a molten chocolate centre',119,true),
  -- Burger Barn
  ('burger-barn','burgers','Classic Veg Burger','Crispy veg patty with lettuce and mayo',129,true),
  ('burger-barn','burgers','Cheese Veg Burger','Veg patty with double cheese',159,true),
  ('burger-barn','burgers','Crispy Chicken Burger','Fried chicken fillet with slaw',179,false),
  ('burger-barn','burgers','Peri Peri Fries','Crispy fries with peri peri seasoning',99,true),
  ('burger-barn','beverages','Chocolate Shake','Thick chocolate milkshake',149,true),
  -- Dosa Darbar
  ('dosa-darbar','south-indian','Plain Dosa','Thin crispy rice crepe with chutneys',80,true),
  ('dosa-darbar','south-indian','Mysore Masala Dosa','Dosa with red chutney and potato masala',130,true),
  ('dosa-darbar','south-indian','Rava Dosa','Crispy semolina dosa with onions',120,true),
  ('dosa-darbar','south-indian','Set Dosa (3 pcs)','Soft sponge dosas with sagu',100,true),
  ('dosa-darbar','south-indian','Upma','Savoury semolina porridge',70,true),
  ('dosa-darbar','beverages','Mango Lassi','Chilled mango yoghurt drink',79,true),
  -- Tandoor Tales
  ('tandoor-tales','north-indian','Butter Chicken','Creamy tomato curry with tandoori chicken',329,false),
  ('tandoor-tales','north-indian','Chicken Tikka','Charcoal-grilled marinated chicken',289,false),
  ('tandoor-tales','north-indian','Paneer Butter Masala','Paneer in rich buttery gravy',269,true),
  ('tandoor-tales','north-indian','Dal Makhani','Slow-cooked black lentils with cream',229,true),
  ('tandoor-tales','north-indian','Garlic Naan','Soft tandoor bread with garlic',49,true),
  ('tandoor-tales','beverages','Sweet Lassi','Thick sweet yoghurt drink',89,true),
  -- Sweet Tooth Studio
  ('sweet-tooth-studio','desserts','Gulab Jamun (4 pcs)','Warm milk dumplings in sugar syrup',129,true),
  ('sweet-tooth-studio','desserts','Rasmalai (2 pcs)','Soft cheese patties in saffron milk',149,true),
  ('sweet-tooth-studio','desserts','Chocolate Brownie','Fudgy brownie with chocolate sauce',139,true),
  ('sweet-tooth-studio','desserts','Red Velvet Pastry','Layered red velvet with cream cheese',129,true),
  ('sweet-tooth-studio','beverages','Cold Coffee','Iced coffee with ice cream',119,true),
  ('sweet-tooth-studio','beverages','Fresh Lime Soda','Sweet or salted lime soda',79,true),
  -- Green Bowl Kitchen
  ('green-bowl-kitchen','north-indian','Quinoa Veg Bowl','Quinoa with roasted vegetables and hummus',249,true),
  ('green-bowl-kitchen','north-indian','Paneer Tikka Salad','Grilled paneer on fresh greens',229,true),
  ('green-bowl-kitchen','north-indian','Dal Tadka with Jeera Rice','Yellow lentils tempered with spices',189,true),
  ('green-bowl-kitchen','north-indian','Millet Veg Khichdi','Millet and vegetable one-pot meal',169,true),
  ('green-bowl-kitchen','beverages','Fruit Smoothie','Seasonal fruits blended with yoghurt',129,true)
) as v(rslug, cslug, name, description, price, is_veg)
join public.restaurants r on r.slug = v.rslug
join public.food_categories c on c.slug = v.cslug
on conflict (restaurant_id, name) do nothing;
