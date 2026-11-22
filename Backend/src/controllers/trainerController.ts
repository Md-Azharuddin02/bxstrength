import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { ensureTrainerColumnsExist, mapRowToTrainer, normalizeTrainerInput, trainersStore } from '../models/trainer.ts';
import type { ServerTrainer } from '../models/trainer.ts';

export const listTrainers = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM trainers ORDER BY created_at ASC');
        const dbTrainers = result.rows.map(mapRowToTrainer);
        return res.json(dbTrainers);
      } catch (err: any) {
        console.error('database fetch trainers error:', err.message);
        if (err.message && (err.message.includes('does not exist') || err.message.includes('column'))) {
          await ensureTrainerColumnsExist();
          try {
            const retryRes = await dbPool.query('SELECT * FROM trainers ORDER BY created_at ASC');
            return res.json(retryRes.rows.map(mapRowToTrainer));
          } catch { }
        }
      }
    }
    res.json(trainersStore);
  } catch (err: any) {
    console.error('Fetch trainers error:', err.message);
    res.json(trainersStore);
  }
};

export const createTrainer = async (req: any, res: any) => {
  try {
    const { name, role, image, bio } = req.body;

    if (!name || !role || !image || !bio) {
      return res.status(400).json({ error: 'Coach name, role title, photo URL, and bio are required.' });
    }

    const t = normalizeTrainerInput(req.body, ['Strength & Conditioning']);

    const trainerId = `coach-${Date.now()}`;

    const newTrainer: ServerTrainer = { id: trainerId, ...t };

    if (dbPool) {
      try {
        await ensureTrainerColumnsExist();
        await dbPool.query(
          `INSERT INTO trainers (id, name, role, coach_position, headline, image, bio, secondary_bio, specialties, experience_years, clients_served, rating, languages, availability, certification, certifications, achievements, gallery_photos, gallery_videos, socials, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())`,
          [
            trainerId, t.name, t.role, t.coachPosition, t.headline, t.image, t.bio, t.secondaryBio,
            JSON.stringify(t.specialties), newTrainer.experienceYears, newTrainer.clientsServed, newTrainer.rating, JSON.stringify(t.languages), t.availability,
            t.certification, JSON.stringify(t.certifications), JSON.stringify(t.achievements),
            JSON.stringify(t.galleryPhotos), JSON.stringify(t.galleryVideos), JSON.stringify(t.socials)
          ]
        );
      } catch (e: any) {
        console.error('database add trainer error:', e.message);
      }
    }

    trainersStore.unshift(newTrainer);
    res.status(201).json({ message: `Coach card for ${t.name} published live to database!`, data: newTrainer });
  } catch (err: any) {
    console.error('Create trainer error:', err.message);
    res.status(500).json({ error: 'Failed to create coach profile' });
  }
};

export const updateTrainer = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const t = normalizeTrainerInput(req.body, ['Strength']);

    if (dbPool) {
      try {
        await ensureTrainerColumnsExist();
        await dbPool.query(
          `INSERT INTO trainers (
            id, name, role, coach_position, headline, image, bio, secondary_bio,
            specialties, experience_years, clients_served, rating, languages, availability,
            certification, certifications, achievements, gallery_photos, gallery_videos, socials, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            coach_position = EXCLUDED.coach_position,
            headline = EXCLUDED.headline,
            image = EXCLUDED.image,
            bio = EXCLUDED.bio,
            secondary_bio = EXCLUDED.secondary_bio,
            specialties = EXCLUDED.specialties,
            experience_years = EXCLUDED.experience_years,
            clients_served = EXCLUDED.clients_served,
            rating = EXCLUDED.rating,
            languages = EXCLUDED.languages,
            availability = EXCLUDED.availability,
            certification = EXCLUDED.certification,
            certifications = EXCLUDED.certifications,
            achievements = EXCLUDED.achievements,
            gallery_photos = EXCLUDED.gallery_photos,
            gallery_videos = EXCLUDED.gallery_videos,
            socials = EXCLUDED.socials`,
          [
            id, t.name, t.role, t.coachPosition, t.headline, t.image, t.bio, t.secondaryBio,
            JSON.stringify(t.specialties), t.experienceYears, t.clientsServed, t.rating,
            JSON.stringify(t.languages), t.availability, t.certification, JSON.stringify(t.certifications),
            JSON.stringify(t.achievements), JSON.stringify(t.galleryPhotos), JSON.stringify(t.galleryVideos), JSON.stringify(t.socials)
          ]
        );
      } catch (e: any) {
        console.error('database update trainer error:', e.message);
      }
    }

    const idx = trainersStore.findIndex(t => t.id === id);
    const updated: ServerTrainer = { id, ...t };

    if (idx !== -1) {
      trainersStore[idx] = updated;
    } else {
      trainersStore.push(updated);
    }

    res.json({ message: `Coach ${t.name} updated live in database!`, data: updated });
  } catch (err: any) {
    console.error('Update trainer error:', err.message);
    res.status(500).json({ error: 'Failed to update coach profile' });
  }
};

export const deleteTrainer = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM trainers WHERE id = $1', [id]);
      } catch (e: any) { }
    }

    const idx = trainersStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      trainersStore.splice(idx, 1);
    }

    res.json({ message: `Coach ${id} deleted from live website and database!` });
  } catch (err: any) {
    console.error('Delete trainer error:', err.message);
    res.status(500).json({ error: 'Failed to delete coach' });
  }
};
