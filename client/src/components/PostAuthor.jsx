import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactTimeAgo from 'react-time-ago';
import TimeAgo from 'javascript-time-ago';

// Import locale data for `react-time-ago` and `javascript-time-ago`
import en from 'javascript-time-ago/locale/en.json';
import ru from 'javascript-time-ago/locale/ru.json';

// Initialize locales
TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(ru);

const PostAuthor = ({ creator, createdAt }) => {
  const [author, setAuthor] = useState({});

  useEffect(() => {
    const getAuthor = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/${creator}`);
        if (response?.data) {
          setAuthor(response.data.user); // Accessing the nested user object
        } else {
          console.log("No data returned from API");
        }
      } catch (error) {
        console.log("Error fetching author:", error);
      }
    };

    if (creator) {
      getAuthor();
    }
  }, [creator]);

  // Ensure `createdAt` is a valid date
  const validDate = createdAt ? new Date(createdAt) : null;
  const isValidDate = validDate instanceof Date && !isNaN(validDate);

  return (
    <Link to={`/posts/users/${creator}`} className='post__author'>
      <div className='post__author-avatar'>
        <img src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${author?.avatar}`} alt={author?.name || 'Author'} />
      </div>
      <div className='post__author-details'>
        <h5>By: {author?.name || 'Unknown Author'}</h5>
        <small>
          {isValidDate ? <ReactTimeAgo date={validDate} locale="en-US" /> : 'Unknown Date'}
        </small>
      </div>
    </Link>
  );
};

export default PostAuthor;
