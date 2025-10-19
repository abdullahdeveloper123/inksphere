<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Jwt_handler;
use App\Models\Users as ModelsUsers;
use App\Models\Blogs;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;



class Users extends Controller
{
  function me(Request $request)
  {
    if ($request->method() == 'GET') {
      $token = substr($request->header('Authorization'), 7);
      $jwtHandler = new Jwt_handler();
      $user_id = $jwtHandler->verify_token($token);
      $user = ModelsUsers::where('id', $user_id)->first();
      if ($user) {
        return response()->json($user->toArray(), 200);
      } else {
        echo "no user found";
      }
    }
    if ($request->method() == 'PUT') {
      $token = substr($request->header('Authorization'), 7);
      $jwtHandler = new Jwt_handler();
      $user_id = $jwtHandler->verify_token($token);
      $user = ModelsUsers::where('id', $user_id)->first();
      if ($user) {
        $user->update([
          'bio' => $request->bio
        ]);

        return  ["message" => "Profile updated successfully"];
      }
    }
  }

  function get_blogs(Request $request, $id)
  {


    $blogs = DB::table('blogs as b')
      ->select(
        'b.user_id',
        'b.id',
        'b.user_id',
        'b.title',
        'b.content',
        'b.created_at',
        'b.updated_at',
        'u.username',
        'u.profile_pic',
        DB::raw('COUNT(DISTINCT f.id) as favorites_count')
      )
      ->leftJoin('users as u', 'b.user_id', '=', 'u.id')
      ->leftJoin('favorites as f', 'b.id', '=', 'f.blog_id')
      ->where('b.user_id', $id)
      ->groupBy('b.id', 'u.username', 'u.profile_pic', 'b.user_id', 'b.title', 'b.content', 'b.created_at', 'b.updated_at')

      ->orderByDesc('favorites_count')
      ->orderByDesc('b.created_at')
      ->get();

    $blogs = $blogs->map(function ($blog) use ($id) {
      $blog->is_favorited = \App\Models\Favorites::where('blog_id', $blog->id)
        ->where('user_id', $id)
        ->exists();
      return $blog;
    });

    return response()->json($blogs);
  }

  // UPload image

  function upload_image(Request $request)
  {


    $header_token = substr($request->header('Authorization'), 7);
    $jwtHandler = new Jwt_handler();
    $user_id = $jwtHandler->verify_token($header_token);

    $image = $request->file('file');
    $parent_folder = 'uploads/images/' . $user_id;
    $img_type = 'other';

    // Choose subfolder based on query param
    if ($request->query('image_type') == 'profile') {
      $folder = $parent_folder . '/profile_img';
      $img_type='profile_img';
      
    } elseif ($request->query('image_type') == 'banner') {
      $folder = $parent_folder . '/banner_img';
      $img_type='banner_img';
    } else {
      $folder = $parent_folder . '/others';
    }

    // Store in 'public' disk (storage/app/public)
    $path = $image->store($folder, 'public');
    $filename = basename($path);
    $request->query('image_type') == 'profile'? ModelsUsers::where('id',$user_id)->update([
      'profile_pic'=>"storage/uploads/images/{$user_id}/{$img_type}/{$filename}",
      
    ]): ModelsUsers::where('id',$user_id)->update([
      'banner_pic'=>"storage/uploads/images/{$user_id}/{$img_type}/{$filename}",
      
    ]);
   

    // ✅ Correct URL (publicly accessible)
    return response()->json([
      'filename' => $filename,
      'url' => "storage/uploads/images/{$user_id}/{$img_type}/{$filename}"
    ]);
  }
}
