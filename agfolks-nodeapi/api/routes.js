const sliderController = require('./controllers/sliderController');
const menuController = require('./controllers/menuController');
const categoryController = require('./controllers/categoryController');
const homeController = require('./controllers/homeController');
const storeController = require('./controllers/storeController');

const authController = require('./controllers/auth/authController');
const manufacturerController = require('./controllers/auth/manufacturerController');
const  cartController = require('./controllers/cartController');
const  paymentController = require('./controllers/paymentController');
const  countryController = require('./controllers/countryController');

// Manage routes
module.exports = function (app, express) {

    // slider endpoints
    app.get('/api/get_slider', sliderController.get_slider);

    // menu endpoints
    // REST API for parent menu
    app.get('/api/get_menu', menuController.get_menu);
    // REST API for footer menu
    app.get('/api/get_footer', menuController.get_footer);

    // categories endpoints
    app.get('/api/get_categories', categoryController.get_categories);

    // get featured categories endpoints
    app.get('/api/get_featured_categories', categoryController.get_featured_categories);

    //home endpoints
    app.get('/api/get_cms_page_content', homeController.get_cms_page_content);

    //product endpoints
    // REST API for featured product
    app.get('/api/get_store_list', storeController.get_store_list);
    // REST API for product(store) list.
    app.get('/api/get_products_list', storeController.get_products_list);
    // REST API for poduct details
    app.get('/api/get_product_details', storeController.get_product_details);
    // REST API for autocomplete product search using categoryId and name
    app.get('/api/search_products', storeController.search_products);

    // REST API for get store attributes
    app.get('/api/get_store_attributes', storeController.get_store_attributes);


    //Auth endpoints
    app.post('/api/sign_up', authController.sign_up);
    app.post('/api/login', authController.login); 
    // udpate user profile 
    app.post('/api/edit_user_profile', authController.edit_user_profile);
    // udpate user address 
    app.post('/api/edit_address', authController.edit_address);
    // remove user address 
    app.get('/api/remove_address', authController.remove_address);
    // change password  
    app.post('/api/update_password', authController.update_password);

    app.post('/api/save_user_address', authController.save_user_address);
    app.post('/api/forgot_pass', authController.forgot_password);
    app.post('/api/reset_pass', authController.reset_password);

    // get current user address 
    app.get('/api/get_current_user_address', authController.get_current_user_address);

    // get current user address 
    app.get('/api/get_current_user', authController.get_current_user);

    // REST API for get user addresses.
    app.get('/api/get_user_address', authController.get_user_address);

    // REST API for get user orders.
    app.get('/api/get_user_orders', authController.get_user_orders);

    // REST API for get order details
    app.get('/api/get_order_details', authController.get_order_details);

    //Manufacturer endpoints
    app.post('/api/manufacturer_sign_up', manufacturerController.manufacturer_sign_up);
    app.post('/api/manufacturer_login', manufacturerController.manufacturer_login);

    //Cart endpoints
    // REST API  add product in temporary table
    app.post('/api/tmp_add_to_product', cartController.tmp_add_to_product);
    //REST API for get cart information
    app.get('/api/get_product_cart_info', cartController.get_product_cart_info);
    // REST API for remove product from cart
    app.get('/api/remove_cart_item', cartController.remove_cart_item);
    // REST API for cart sales/shipping 
    app.post('/api/get_cart_sales_shipping', cartController.get_cart_sales_shipping);
    // REST API for update member id against added product in cart 
    app.post('/api/update_add_to_product', cartController.update_add_to_product);
    // REST API for LTL shipping 
    app.get('/api/ltl_shipping', cartController.ltl_shipping);

    // REST API for review and place order before go to final payment page
    app.post('/api/review_order', cartController.review_order);

    // REST API for cart sales/shipping 
    app.post('/api/make_payment', paymentController.make_payment);
    // get counties endpoints
    app.get('/api/get_countries', countryController.get_countries);

    // get states endpoints
    app.get('/api/get_states', countryController.get_states);

    // updare cart
    app.post('/api/update_cart', cartController.update_cart);

    // Apply Coupon Code
    app.post('/api/apply_coupon', cartController.apply_coupon);

    // Remove Coupon Code
    app.post('/api/remove_coupon', cartController.remove_coupon);

    // REST API for get user wishlists.
    //app.get('/api/get_user_wishlists', authController.get_user_wishlists);
    // REST API for get user wishlist products.
    app.get('/api/get_user_wishlist_products', authController.get_user_wishlist_products);    
    // REST API for add new product to wishlist.
    app.post('/api/add_to_wishlist', authController.add_to_wishlist);
    // REST API for remove product from wishlist.
    app.get('/api/remove_product_from_wishlist', authController.remove_product_from_wishlist);

    // REST API  for get all parents of child category
    app.get('/api/get_category_parents', categoryController.get_category_parents);

}
