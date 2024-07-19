import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorPage from './pages/ErrorPage';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Register from './pages/Register';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import Authors from './pages/Authors';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import DeletePost from './pages/DeletePost';
import CategoryPosts from './pages/CategoryPosts';
import AuthorPosts from './pages/AuthorPosts';
import Logout from './pages/Logout';
import Dashboard from './pages/Dashboard';
import UserProvider from './context/userContext';

const router = createBrowserRouter([
{
  path: "/",
  element: <UserProvider><Layout/></UserProvider>,
  errorElement: <ErrorPage/>,
  children: [
    {index : true, element: <Home />},
    {path : "posts/:id", element: <PostDetail />},
    {path : "register", element: <Register />},
    {path : "login", element: <Login />},
    {path : "profile/:id", element: <UserProfile />},
    {path : "authors", element: <Authors />},
    {path : "create", element: <CreatePost />},
    {path : "posts/:categories/:category", element: <CategoryPosts />},
    {path : "posts/users/:id", element: <AuthorPosts />},
    {path : "myposts/:id", element: <Dashboard />},
    {path : "posts/:id/edit", element: <EditPost />},
    {path : "posts/:id/delete", element: <DeletePost />},
    {path : "logout", element: <Logout />},
  ]
}
])


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);

