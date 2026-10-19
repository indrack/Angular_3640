import { DayWods } from '../models/wod.model';

export const WODS_DATA: DayWods = {
  domingo: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
:30 Easy Cardio
8 Scap Push-Ups
8 Alternating Plank Shoulder Taps/Side
6 Down Dog to Push-Up
10 Jump Air Squats (Squeeze the hips, extend violently)
3 Inchworms
10-second Handstand Hold`
    },
    {
      titulo: 'Gymnastics (Handstand Walk)',
      contenido: `10:00 PRACTICE / SKILL DEVELOPMENT
Handstand Kick Up - Handstand Hold - Handstand Negative
Freedom (Advanced) - Freestanding Handstand Push Up
Independence (Intermediate) - Kick-Ups + Slow Negative + Kip
Liberty (Beginner) - Pike Handstand Push Ups/ Box Handstand Push Up`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
21-15-9
Power Cleans, 42.5/30
Handstand Push-ups
*Rest 3 mins*
15-12-9
Power Cleans, 42.5/30
Handstand Push-ups`
    },
  ],
  lunes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
10 Lateral Band Walks (each way)
10 Glute Bridges
10 Air Squats
5 Slow Kang Squats
5 Broad Jumps`
    },
    {
      titulo: 'Weightlifting (Back Squat)',
      contenido: `4 Back Squats, RPE 7
*Every 1 min for 6 mins.*`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
50 Wall Balls, 20/14 lbs
50 Push-ups
40 Wall Balls, 20/14 lbs
40 Push-ups
30 Wall Balls, 20/14 lbs
30 Push-ups
20 Wall Balls, 20/14 lbs
20 Push-ups
10 Wall Balls, 20/14 lbs
10 Push-ups`
    },
  ],
  martes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
10 Glute Bridges
10 Dead Bugs
10 Banded Good Mornings
5 Romanian Deadlifts
5 Deadlifts`
    },
    {
      titulo: 'Weightlifting (Deadlift)',
      contenido: `Deadlift 8-8-8
Use the heaviest weight you can for each set.
Rest as needed between sets.`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*EMOM 24*
1. 220/200 m Row
2. 8 Deadlifts, 102.5/70
3. 220/200 m Row
4. 10 Toes-to-bars`
    },
  ],
  miercoles: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
1:00 Jump Rope
10 Box Step Ups
10 Scap Pull-Ups
5 Ring Rows
2 Seated J-Hooks on the rope`
    },
    {
      titulo: 'Gymnastics (Rope Climb)',
      contenido: `*ON A 8:00 CLOCK...*
Rope Climb Practice
Freedom (Advanced) - Rope Climb Practice (Jump + Foot Lock+ Descent)
Independence (Intermediate) - Rope Climb Practice (Jump + Foot Lock)
Liberty (Beginner) - Zombie Rope Climbs/Foot Clamp and Stand`
    },
    {
      titulo: 'Custom Metcon (Reps)',
      contenido: `5 rounds for max reps of:
max rep Double Under, 3 mins
max rep Box Step-ups, 20 in, 2 mins
max rep Rope Climbs/ Strict Pull-ups, 1 min
-No Additional Rest b/t Sets-`
    },
  ],
  jueves: [
    {
      titulo: 'Warmup',
      contenido: `*2 Rounds*
1 MIN Easy-Moderate Cardio Choice
5 Up Downs
10 Alternating V Ups
10 AbMat Sit-Ups`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*5 rounds for time of:*
20 V-Ups
20 Burpees`
    },
    {
      titulo: 'Weightlifting (Bench Press)',
      contenido: `Bench Press 10-10-10-10-10
Use the heaviest weight you can for each set.
Rest as needed between sets.`
    },
  ],
  viernes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
10 Scap Push-Ups
10 Alternating Samson Lunges
20 Line Hops
10 Glute Bridges
10 Light Russian Kettlebell Swings
6 Box Step-Ups`
    },
    {
      titulo: 'Weightlifting (Hang Power Clean)',
      contenido: `1x [ 4 Hang Power Cleans + 2 Push Jerks ]
Every 1:30 for 7:30.
Start Moderate and build to a Moderate-Heavy`
    },
    {
      titulo: 'Custom Metcon (Rondas)',
      contenido: `Jack
Complete as many rounds as possible in 20 mins of:
10 Push Press, 52.5/35
10 Kettlebell Swings, 24/16
10 Box Jumps, 24/20 in`
    },
  ],
  sabado: [
    {
      titulo: 'Warmup',
      contenido: `Rowling!
It’s 5 rounds (each) you vs. your partner.
Your goal each round is to row and get the monitor to stop on exactly 100m, without slowing your pace.
Score how many meters you’re over or under each round.
That’s your penalty burpees while your partner rows (max 10 per round). Example: Row 105m = 5 burpees. Lowest total meters off wins!`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*Teams of 3*
*5 rounds for time of:*
5 x 50ft Dumbbell Farmers Carry, 32.5/22.5
50/42 Row Calories
20 Synchronized Goblet Squats, 32.5/22.5
Split Farmer Carry and Row reps as needed. Perform the Squats Synchro with your partners.`
    },
    {
      titulo: 'Accesorio',
      contenido: `*4 rounds for quality of:*
20 Banded Chest Flies
20 Banded Rows`
    },
  ],
};
