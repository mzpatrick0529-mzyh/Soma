"""
Blog System Module

This module handles blog post creation, management, and avatar-generated content.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class BlogManager:
    """
    Manages blog posts for user and avatar-generated content.
    """

    def __init__(self, user_id: str, avatar_engine=None):
        """
        Initialize blog manager.

        Args:
            user_id: Unique identifier for the user
            avatar_engine: Optional AvatarEngine for generating content
        """
        self.user_id = user_id
        self.avatar_engine = avatar_engine
        self.posts = []

    def create_post(self, title: str, content: str, author: str = "user", 
                    tags: Optional[List[str]] = None) -> Dict:
        """
        Create a new blog post.

        Args:
            title: Title of the post
            content: Content of the post
            author: Author of the post ("user" or "avatar")
            tags: Optional list of tags

        Returns:
            Dictionary containing post information
        """
        post_id = f"post_{datetime.now().timestamp()}"
        
        post = {
            "post_id": post_id,
            "title": title,
            "content": content,
            "author": author,
            "tags": tags or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "user_id": self.user_id
        }
        
        self.posts.append(post)
        logger.info(f"Created blog post: {post_id} by {author}")
        
        return post

    def generate_avatar_post(self, topic: Optional[str] = None) -> Dict:
        """
        Generate a blog post from the avatar's perspective.

        Args:
            topic: Optional topic for the post

        Returns:
            Dictionary containing the generated post
        """
        if not self.avatar_engine:
            raise ValueError("Avatar engine not initialized")
        
        # Generate content based on avatar's personality and memories
        if topic:
            title = f"My thoughts on {topic}"
            content = f"I've been reflecting on {topic} lately. Based on our interactions and what I know about you, here are my thoughts..."
        else:
            title = "An Update From Me"
            content = "I wanted to share some thoughts with you. It's been wonderful connecting with you, and I've been thinking about our conversations..."
        
        # In production, use the fine-tuned model to generate authentic content
        post = self.create_post(
            title=title,
            content=content,
            author="avatar",
            tags=["avatar-generated", "update"]
        )
        
        logger.info(f"Generated avatar post: {post['post_id']}")
        return post

    def get_post(self, post_id: str) -> Optional[Dict]:
        """
        Get a specific blog post by ID.

        Args:
            post_id: ID of the post

        Returns:
            Post dictionary, or None if not found
        """
        for post in self.posts:
            if post["post_id"] == post_id:
                return post
        return None

    def update_post(self, post_id: str, title: Optional[str] = None, 
                    content: Optional[str] = None, tags: Optional[List[str]] = None) -> Dict:
        """
        Update an existing blog post.

        Args:
            post_id: ID of the post to update
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)

        Returns:
            Updated post dictionary
        """
        post = self.get_post(post_id)
        if not post:
            raise ValueError(f"Post not found: {post_id}")
        
        if title:
            post["title"] = title
        if content:
            post["content"] = content
        if tags:
            post["tags"] = tags
        
        post["updated_at"] = datetime.now().isoformat()
        
        logger.info(f"Updated blog post: {post_id}")
        return post

    def delete_post(self, post_id: str) -> bool:
        """
        Delete a blog post.

        Args:
            post_id: ID of the post to delete

        Returns:
            True if deleted, False if not found
        """
        for i, post in enumerate(self.posts):
            if post["post_id"] == post_id:
                self.posts.pop(i)
                logger.info(f"Deleted blog post: {post_id}")
                return True
        return False

    def list_posts(self, author: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        List blog posts.

        Args:
            author: Filter by author ("user" or "avatar")
            limit: Optional limit on number of posts

        Returns:
            List of post dictionaries
        """
        posts = self.posts
        
        if author:
            posts = [p for p in posts if p["author"] == author]
        
        # Sort by creation date (newest first)
        posts = sorted(posts, key=lambda p: p["created_at"], reverse=True)
        
        if limit:
            posts = posts[:limit]
        
        return posts

    def search_posts(self, query: str) -> List[Dict]:
        """
        Search blog posts by title or content.

        Args:
            query: Search query

        Returns:
            List of matching posts
        """
        query_lower = query.lower()
        matches = []
        
        for post in self.posts:
            if (query_lower in post["title"].lower() or 
                query_lower in post["content"].lower()):
                matches.append(post)
        
        logger.info(f"Found {len(matches)} posts matching query: {query}")
        return matches

    def export_blog(self, output_path: str) -> None:
        """
        Export all blog posts to a file.

        Args:
            output_path: Path to save the blog posts
        """
        import json
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "user_id": self.user_id,
                "posts": self.posts,
                "total_posts": len(self.posts)
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Exported blog to {output_path}")
