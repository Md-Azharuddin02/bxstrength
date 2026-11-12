import { Router } from 'express';
import { initiateJourney, createCheckoutIntent, verifyJourneyPayment, getJourneyBooking, getLatestJourneyByEmail, confirmJourneyBooking, listJourneyBookings } from '../controllers/journeyController.ts';
const router = Router();

router.post('/journey/initiate', initiateJourney);

router.post('/journey/create-checkout-intent', createCheckoutIntent);

router.post('/journey/verify-payment', verifyJourneyPayment);

router.get('/journey/booking/:id', getJourneyBooking);

router.get('/journey/latest-by-email/:email', getLatestJourneyByEmail);

router.post('/admin/journey/confirm-booking', confirmJourneyBooking);

router.get('/admin/journey/bookings', listJourneyBookings);

export default router;
