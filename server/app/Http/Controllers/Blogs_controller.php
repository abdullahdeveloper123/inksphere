<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use App\Models\Blogs;
use App\Http\Controllers\Jwt_handler;
use Exception;
use Illuminate\Http\Request;

class Blogs_controller extends Controller
{
    function all_blogs(Request $request)
    {
        // If request is POST
        if ($request->method() === 'GET') {
            $header_token = substr($request->header('Authorization'), 7);
            $jwtHandler = new Jwt_handler();
            $user_id = $jwtHandler->verify_token($header_token);


            $blogs = DB::table('blogs as b')
                ->select(
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
                ->groupBy('b.id', 'u.username', 'u.profile_pic', 'b.user_id', 'b.title', 'b.content', 'b.created_at', 'b.updated_at')
                ->orderByDesc('favorites_count')
                ->orderByDesc('b.created_at')
                ->get();

            $blogs = $blogs->map(function ($blog) use ($user_id) {
                $blog->is_favorited = \App\Models\Favorites::where('blog_id', $blog->id)
                    ->where('user_id', $user_id)
                    ->exists();
                return $blog;
            });


            return response()->json($blogs);
        }

        // IF rquest is POST
        elseif ($request->method() === 'POST') {
            $header_token = substr($request->header('Authorization'), 7);
            $jwtHandler = new Jwt_handler();
            $user_id = $jwtHandler->verify_token($header_token);
            $data = $request->json()->all();
            $title = $data['title'];
            $content = $data['content'];

            $blog = Blogs::create([
                'user_id' => $user_id,
                'title' => $title,
                'content' => $content,
            ]);

            return [
                "id" => $blog->id,
                "message" => "Blog created successfully"
            ];
        }
    }

    //   Blog Detail/Open
    function  open_blog(Request $request, $id)
    {

        $blog = DB::table('blogs as b')
            ->select(
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
            ->where('b.id', $id)
            ->groupBy('b.id') // only b.id, like your new query
            ->first(); // single result


        return response()->json($blog);
    }

    function search_blog(Request $request)
    {
        // $header_token = substr($request->header('Authorization'), 7);
        // $jwtHandler = new Jwt_handler();
        // $user_id = $jwtHandler->verify_token($header_token);
        // $keyword = $request->query('keyword');

        // $blogs = DB::table('blogs as b')
        //     ->select(
        //         'b.id',
        //         'b.user_id',
        //         'b.title',
        //         'b.content',
        //         'b.created_at',
        //         'b.updated_at',
        //         'u.username',
        //         'u.profile_pic',
        //         DB::raw('COUNT(DISTINCT f.id) as favorites_count')
        //     )
        //     ->leftJoin('users as u', 'b.user_id', '=', 'u.id')
        //     ->leftJoin('favorites as f', 'b.id', '=', 'f.blog_id')
        //     ->where(function ($query) use ($keyword) {
        //         $query->where('b.title', 'LIKE', '%' . $keyword . '%')
        //               ->orWhere('b.content', 'LIKE', '%' . $keyword . '%');
        //     })
        //     ->groupBy('b.id', 'u.username', 'u.profile_pic', 'b.user_id', 'b.title', 'b.content', 'b.created_at', 'b.updated_at')
        //     ->orderByDesc('favorites_count')
        //     ->orderByDesc('b.created_at')
        //     ->get();

        // $blogs = $blogs->map(function ($blog) use ($user_id) {
        //     $blog->is_favorited = \App\Models\Favorites::where('blog_id', $blog->id)
        //         ->where('user_id', $user_id)
        //         ->exists();
        //     return $blog;
        // });

        //     return [
        //     [
        //         "id" => 1,
        //         "user_id" => "2",
        //         "title" => "Exploring the Future of Smart Cities",
        //         "content" => "A quick overview of how smart technologies are shaping urban development.",
        //         "created_at" => "2025-10-16 23:51:12",
        //         "updated_at" => "2025-10-16 23:51:12",
        //         "username" => "my-user-name",
        //         "profile_pic" => "storage/uploads/images/2/profile_img/user1.jpg",
        //         "favorites_count" => 3,
        //         "is_favorited" => true,
        //     ],
        //     [
        //         "id" => 2,
        //         "user_id" => "2",
        //         "title" => "Getting Started with Python",
        //         "content" => "An easy introduction to Python basics for absolute beginners.",
        //         "created_at" => "2025-10-16 23:52:35",
        //         "updated_at" => "2025-10-16 23:52:35",
        //         "username" => "my-user-name",
        //         "profile_pic" => "storage/uploads/images/2/profile_img/user2.jpg",
        //         "favorites_count" => 1,
        //         "is_favorited" => false,
        //     ],
        //     [
        //         "id" => 3,
        //         "user_id" => "3",
        //         "title" => "Top 10 JavaScript Tricks",
        //         "content" => "Discover some useful JavaScript techniques every developer should know.",
        //         "created_at" => "2025-10-17 10:10:45",
        //         "updated_at" => "2025-10-17 10:10:45",
        //         "username" => "devguru",
        //         "profile_pic" => "storage/uploads/images/3/profile_img/user3.jpg",
        //         "favorites_count" => 5,
        //         "is_favorited" => true,
        //     ],
        //     [
        //         "id" => 4,
        //         "user_id" => "4",
        //         "title" => "Why Learn React in 2025",
        //         "content" => "React remains the top choice for modern frontend development—here’s why.",
        //         "created_at" => "2025-10-17 12:25:10",
        //         "updated_at" => "2025-10-17 12:25:10",
        //         "username" => "frontendpro",
        //         "profile_pic" => "storage/uploads/images/4/profile_img/user4.jpg",
        //         "favorites_count" => 2,
        //         "is_favorited" => false,
        //     ],
        //     [
        //         "id" => 5,
        //         "user_id" => "5",
        //         "title" => "Mastering Laravel Eloquent",
        //         "content" => "A guide to writing cleaner and more efficient database queries with Eloquent ORM.",
        //         "created_at" => "2025-10-17 15:05:00",
        //         "updated_at" => "2025-10-17 15:05:00",
        //         "username" => "backendgenius",
        //         "profile_pic" => "storage/uploads/images/5/profile_img/user5.jpg",
        //         "favorites_count" => 4,
        //         "is_favorited" => true,
        //     ],
        // ];

        return ['hdada' => 'sda'];
    }

    function get_it(Request $request)
    {

        $header_token = substr($request->header('Authorization'), 7);
        $jwtHandler = new Jwt_handler();
        $user_id = $jwtHandler->verify_token($header_token);
        $keyword = $request->query('keyword');

        $blogs = DB::table('blogs as b')
            ->select(
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
            ->where(function ($query) use ($keyword) {
                $query->where('b.title', 'LIKE', '%' . $keyword . '%')
                    ->orWhere('b.content', 'LIKE', '%' . $keyword . '%');
            })
            ->groupBy('b.id', 'u.username', 'u.profile_pic', 'b.user_id', 'b.title', 'b.content', 'b.created_at', 'b.updated_at')
            ->orderByDesc('favorites_count')
            ->orderByDesc('b.created_at')
            ->get();

        $blogs = $blogs->map(function ($blog) use ($user_id) {
            $blog->is_favorited = \App\Models\Favorites::where('blog_id', $blog->id)
                ->where('user_id', $user_id)
                ->exists();
            return $blog;
        });

        return response()->json($blogs);
    }
}
