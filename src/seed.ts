import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Note } from './models/Note';
import { Post } from './models/Post';

/**
 * Populate the database with an admin, a few users (with interests) and some
 * notes/posts so the role-based views and both aggregations have data to show.
 * Run with:  npm run seed
 */
const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Note.deleteMany({}), Post.deleteMany({})]);

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    interests: ['chess', 'reading'],
  });

  const alice = await User.create({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'Alice123!',
    role: 'user',
    interests: ['chess', 'hiking'],
  });

  const bob = await User.create({
    name: 'Bob',
    email: 'bob@example.com',
    password: 'Bob12345!',
    role: 'user',
    interests: ['reading', 'gaming'],
  });

  await Note.create([
    { title: "Alice's first note", content: 'Remember to practice openings.', owner: alice._id },
    { title: "Alice's grocery list", content: 'Milk, eggs, bread.', owner: alice._id },
    { title: "Bob's book notes", content: 'Chapter 3 was great.', owner: bob._id },
  ]);

  await Post.create([
    { title: 'Why I love chess', body: 'A public post by Alice.', author: alice._id, privacy: 'public' },
    { title: "Alice's private thoughts", body: 'Only Alice (and admins) can see this.', author: alice._id, privacy: 'private' },
    { title: 'Best books of the year', body: 'A public post by Bob.', author: bob._id, privacy: 'public' },
    { title: 'Reading habits', body: 'Another public post by Bob.', author: bob._id, privacy: 'public' },
    { title: "Bob's draft", body: 'Not ready to share yet.', author: bob._id, privacy: 'private' },
  ]);

  console.log('Seed complete.');
  console.log('Admin login  -> admin@example.com / Admin123!');
  console.log('User login   -> alice@example.com / Alice123!');
  console.log('User login   -> bob@example.com / Bob12345!');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
