<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users;
use App\Http\Controllers\Jwt_handler;
use App\Http\Controllers\Favorites;
use App\Http\Controllers\Comments;
use App\Http\Controllers\Blogs_controller; 
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;



/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});


Route::any('api/blogs', [Blogs_controller::class, 'all_blogs'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/blogs/{id}', [Blogs_controller::class, 'open_blog'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/users/{id}/blogs', [Users::class, 'get_blogs'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/blogs/{id}/favorite', [Favorites::class, 'add_favorite'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/blogs/{id}/comments', [Comments::class, 'comments'])->withoutMiddleware(VerifyCsrfToken::class);
// Route::post('api/blogs', [Blogs_controller::class, 'add_blog'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/auth/login',[Jwt_handler::class, 'login_view'])->withoutMiddleware(VerifyCsrfToken::class);
Route::post('api/auth/register',[Jwt_handler::class, 'register_view'])->withoutMiddleware(VerifyCsrfToken::class);
Route::any('api/users/me',[Users::class, 'me'])->withoutMiddleware(VerifyCsrfToken::class);
Route::post('api/users/upload-image',[Users::class, 'upload_image'])->withoutMiddleware(VerifyCsrfToken::class);
Route::get('api/get_it',[Blogs_controller::class, 'get_it'])->withoutMiddleware(VerifyCsrfToken::class);






