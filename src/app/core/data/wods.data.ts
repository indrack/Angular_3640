import { DayWods } from '../models/wod.model';

export const WODS_DATA: DayWods = {
  domingo: [
    {
      titulo: 'Warmup',
      contenido: `2 ROUNDS (:45 WORK / :15 TRANSITION)
MIN 1: Easy Row
MIN 2: Air Squats (not fast)
MIN 3: Single Unders
MIN 4: 5 Scap Pull-Ups + 10 Ring Rows`
    },
    {
      titulo: 'Gymnastics (Pull-up)',
      contenido: `Weighted Strict Pull-up 1x3
Use the heaviest weight you can for the set.`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `3 rounds for max reps of:
max rep Row Calories, 3 mins
max rep Dumbbell Goblet Squats, 22.5/15, 2 mins
max rep Single Unders, 1 min
*Rest 2 mins*`
    },
  ],
  lunes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
7 Banded Pull Aparts
7 Banded Face Pulls
7 Banded Straight-Arm Pulldowns
5 Scap Push Ups
5 Push Ups`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
50 Push-ups
1200m Run`
    },
    {
      titulo: 'Skill',
      contenido: `5 rounds, 1 min per station, for max reps of:
Bench Press, pick load
Strict Pull-up
*Rest 1 min*
KG: 85/52.5, 70/42.5, 60/37.5 barbell, 32.5/22.5, 22.5/15, 15/10 DB
Rotate immediately to the next station every 1 min,
the clock does not stop or reset between stations.`
    },
  ],
  martes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
20 Singles or 10-20 Double Unders
8 PVC Pass Throughs
8 PVC Overhead Squats
6 Alt. Samson Lunges
6 Squat Therapy Reps`
    },
    {
      titulo: 'Weightlifting (Overhead Squat)',
      contenido: `ON A 15:00 RUNNING CLOCK
Build to a Mod-Heavy 3-Rep Overhead Squat
*Barbell comes from Rack. Option for Front Squat if not putting bar overhead.`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*3 rounds for time of:*
100 Double Unders
25 Overhead Squats, 42.5/30`
    },
  ],
  miercoles: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
10 Empty Bar Good Mornings
10 Hip Extensions or Superman Rocks
10 Slow Sit Ups
5 Inchworm + Push Up
20 Lateral Line Hops`
    },
    {
      titulo: 'Skill',
      contenido: `Every 1 min for 9 mins, alternating between:
3 Deadlifts, pick load
Burpee, 45 secs
Plank Hold, 45 secs
Deadlifts: Start moderate/mod-heavy and build to workout weight`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `5 rounds, each round for time, of:
7 Deadlifts, 142.5/92.5
14 Lateral Burpee Over Bars
21 Sit-ups
Go every 3:30 mins.`
    },
  ],
  jueves: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
100m Run
10 Box Step Ups
10 Banded Lat Press Downs
10 Banded Pull Aparts
10 Hollow Rocks`
    },
    {
      titulo: 'Gymnastics (Muscle-up)',
      contenido: `*ON A 8:00 CLOCK...*
Low Ring or Low Bar Muscle Transition Work
Freedom (Advanced) - Low Ring Muscle Up Transition + Strict Dip
Independence (Intermediate) - Low Ring Muscle Up + Kipping/Jumping Ring Dip
Liberty (Beginner) - Low Ring/Bar Muscle Up Transition + Jumping Dip`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `4 rounds, 5 mins each, for max reps of:
800 m Run
max reps in remaining time Bar Muscle-ups
*Rest 2 mins*`
    },
  ],
  viernes: [
    {
      titulo: 'Warmup',
      contenido: `*3 ROUNDS*
10 Box Step Ups
10 Banded Pass Throughs
10 Banded Lat Press Downs
10 Banded Pull Aparts`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*EMOM 27*
1. 15/12 Calorie Row
2. 20 Box Step Overs, 24/20 in
3. Rest`
    },
    {
      titulo: 'Accesorio',
      contenido: `*2 rounds for quality of:*
30 Russian Twists
30 Flutter Kicks
60 Kettlebell Side Bends, RPE 6
*Rest 1 min*`
    },
  ],
  sabado: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
90 second Cardio of choice
10 PVC Pass Throughs
10 PVC Good Mornings
10 Alternating Step Back Lunges
10 Air Squats
5 Push Up to Down Dog
10 Hollow Rocks`
    },
    {
      titulo: 'Custom Metcon (Rondas)',
      contenido: `*Complete in teams of 2.*
Complete as many rounds as possible in 25 mins of:
20 Hang Power Clean & Jerks, 60/42.5
20 Synchro Reverse Lunges
30 Synchronized Sit-ups
Split the barbell work, 10 each.`
    },
    {
      titulo: 'Accesorio',
      contenido: `Tabata Banded Hamstring Curl
The Tabata interval is 20 secs of work followed
by 10 secs of rest for 8 intervals.
Tabata score is the total reps performed in all of the intervals.`
    },
  ],
};
