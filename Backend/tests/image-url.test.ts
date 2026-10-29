import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudinaryImage, originalFromResized } from '../../src/utils/image';

test('Cloudinary images get a real resize/format transformation and lose the ignored query', () => {
  assert.equal(
    cloudinaryImage('https://res.cloudinary.com/demo/image/upload/v1/Muheeb.png?auto=format&fit=crop&q=80&w=800', 640),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1/Muheeb.png',
  );
});

test('non-Cloudinary and Cloudinary video URLs are left alone', () => {
  const unsplash = 'https://images.unsplash.com/photo-1?auto=format&w=800';
  const video = 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4';
  assert.equal(cloudinaryImage(unsplash, 640), unsplash);
  assert.equal(cloudinaryImage(video, 640), video);
});

test('a failed resized image maps back to the original, and only resized URLs do', () => {
  const original = 'https://res.cloudinary.com/demo/image/upload/v1/Muheeb.png';
  assert.equal(originalFromResized(cloudinaryImage(original, 640)), original);
  assert.equal(originalFromResized(original), null); // already the original: no retry loop
});
