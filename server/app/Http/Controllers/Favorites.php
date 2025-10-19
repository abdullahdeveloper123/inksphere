<?php

namespace App\Http\Controllers;

use App\Models\Favorites as ModelsFavorites;
use Illuminate\Http\Request;

class Favorites extends Controller
{
    function add_favorite(Request $request, $id)
    {
        $check_fav = false;
        if (ModelsFavorites::where('blog_id', $id)->exists()) {
            ModelsFavorites::where('blog_id', $id)->delete();
            return ["favorited" => false, "message" => "Removed from favorites"];

        } else {
            $header_token = substr($request->header('Authorization'), 7);
            $jwtHandler = new Jwt_handler();
            $user_id = $jwtHandler->verify_token($header_token);
            ModelsFavorites::create([
                'user_id' => $user_id,
                'blog_id' => $id
            ]);
            return ["favorited" => True, "message" => "Added to favorites"];
        }
    }
}
