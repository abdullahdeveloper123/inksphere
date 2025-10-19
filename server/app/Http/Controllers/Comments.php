<?php

namespace App\Http\Controllers;

use App\Models\Comments as ModelsComments;
use App\Models\Users;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class Comments extends Controller
{
    function comments(Request $request, $id)
    {



        if ($request->method() === 'GET') {
            $comments = DB::table('comments as c')
                ->select('c.*', 'u.username', 'u.profile_pic')
                ->leftJoin('users as u', 'c.user_id', '=', 'u.id')
                ->where('c.blog_id', $id)
                ->orderByDesc('c.created_at')
                ->get();

            return response()->json($comments, 200);
        } elseif ($request->method() === 'POST') {
            $header_token = substr($request->header('Authorization'), 7);
            $jwtHandler = new Jwt_handler();
            $user_id = $jwtHandler->verify_token($header_token);
            $user = Users::where('id', $user_id)->first();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }
            $username = $user->username;
            $profile_pic = $user->profile_pic;

            $content = $request->json()->get('content');
            $comment = ModelsComments::create([
                'user_id' => $user_id,
                'blog_id' => $id,
                'content' => $content,
                'username' => $username,
                'profile_pic' => $profile_pic,

            ]);

            return ["id" => $comment->id, "message" => "Comment added successfully"];
        }
    }
}
