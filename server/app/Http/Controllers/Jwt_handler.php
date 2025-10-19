<?php

namespace App\Http\Controllers;

use App\Models\Blogs;
use App\Models\Users;
use Firebase\JWT\JWT;
use Firebase\JWT\key;
use Illuminate\Http\Request;

class Jwt_handler extends Controller
{
    function create_token($email, $user_id)
    {
        $secret_key = env('JWT_SECRET_KEY');
        $issue_time = time();
        $expiry_time = $issue_time + (60 * 60);

        $payload = [
            "iss" => 'localhost',
            "issue_date" => $issue_time,
            "exp_time" => $expiry_time,
            "user_email" => $email,
            "user_id" => $user_id
        ];

        $jwt = JWT::encode($payload, $secret_key, 'HS256');

        return $jwt;
    }

    // verify token

    function verify_token($token)
    {
        $secret_key = env('JWT_SECRET_KEY');
        $tkn = JWT::decode($token, new key($secret_key, 'HS256'));
        $payload = (array) $tkn;
        $user_id = $payload['user_id' ?? null];

        return $user_id;
    }

    function login_view(Request $request)
    {
        $method = $request->method();

        if ($request->isMethod('post')) {
            $data = $request->json()->all();
            $email = $data['email'];
            $password = $data['password'];

            $user = Users::where('email', $email)->where('password', $password)->first();
            if ($user) {
                $token = $this->create_token($email, $user->id);
                SetCookie('access_token', $token,  time() + (86400 * 30), "/");
                return ["access_token" => $token, "token_type" => "bearer"];
            }
             return abort(401, 'Invalid credentials');

        } elseif ($request->isMethod('get')) {
            echo 'you made get';
        } else {
            echo "<h1>Mehtod not Allowed</h1>";
        }
    }

    function register_view(Request $request)
    {
        $method = $request->method();

        if ($request->isMethod('post')) {
            // echo 'you made post';
            $data = $request->json()->all();
            $username = htmlspecialchars($data['username']);
            $email = htmlspecialchars($data['email']);
            $password = htmlspecialchars($data['password']);


            if ($email || $username || $password) {
                Users::create([
                    'username' => $username,
                    'email' => $email,
                    'password' => $password,
                ]);


                $user_id = Users::where('email', $email)->value('id');
                $token = $this->create_token($email, $user_id);
                SetCookie('access_token', $token,  time() + (86400 * 30), "/");

                return ["access_token" => $token, "token_type" => "bearer"];
            } else {
                return 'invalid data';
            }
        }
    }
}
