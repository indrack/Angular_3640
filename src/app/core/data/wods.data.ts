import { DayWods } from '../models/wod.model';

export const WODS_DATA: DayWods = {
  domingo: [
    {
      titulo: 'Warmup',
      contenido: `*TEAMS OF 2*
EVERY 1:00 (6:00)
*Partner 1:* 1:00 Max Shuttle Run
*Partner 2:* 1:00 Up Down`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*IN TEAMS OF 2*
*FOR TIME*
3000m Run
200 Burpees
*Partner 1 works while P2 rests. Partners switch as needed.
*Time cap: 35 mins*`
    },
    {
      titulo: 'Accesorio',
      contenido: `*4 rounds for quality of:*
10 Banded Strict Chin-ups
10 Incline Chest Supported Dumbbell Rows, pick load
*Rest 1 min*`
    },
  ],
  lunes: [
    {
      titulo: 'Warmup',
      contenido: `*2 SETS*
1min Cardio
10 Alt. Arm Crosses
10 Scap Push Ups
10 PVC Pass Throughs
10 Empty Bar Bent Over Rows`
    },
    {
      titulo: 'Weightlifting (Bench Press)',
      contenido: `AUGUST MONTHLY CHALLENGE
As many reps as possible in 2 mins of:
Bench Press, 70/42.5`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
800m Run
-- then --
*5 rounds of:*
25 Pull-ups
7 Push Jerks, 60/42.5
*Time cap: 20 mins*`
    },
  ],
  martes: [
    {
      titulo: 'Warmup',
      contenido: `*2 SETS*
10 Air Squats
10 PVC Good Mornings
10 PVC Pass Throughs
10 PVC Strict Press`
    },
    {
      titulo: 'Custom Metcon (Peso)',
      contenido: `CrossFit Total
Back Squat 1 rep max
Shoulder Press 1 rep max
Deadlift 1 rep max
*Athletes have 12:00 at each station to establish a heavy lift for each movement.*`
    },
    {
      titulo: 'Finisher',
      contenido: `*FOR TIME*
50 Burpees`
    },
  ],
  miercoles: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
10 Scap Pull Ups
5 Kip Swings
5 Inchworm to Push Up
5 Overhead Squat
*Into...*
BURGENER WARM-UP (Empty Bar)
3 Down & Up
3 Elbows High & Outside
3 Muscle Snatch
3 Snatch Land
3 Snatch Drop`
    },
    {
      titulo: 'Weightlifting (Power Snatch)',
      contenido: `1x [ 1 Power Snatch + 1 Hang Power Snatch + 1 Squat Snatch ], RPE 7
*Every 2 mins for 10 mins.*
*All 3 reps unbroken, start light build in weight to Moderate-Heavy*`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*3 rounds for time of:*
21 Toes-to-bars
7 Power Snatches, 42.5/30
7 Hang Power Snatches, 42.5/30
7 Squat Snatches, 42.5/30`
    },
  ],
  jueves: [
    {
      titulo: 'Warmup',
      contenido: `*2 Rounds*
6 Up Downs
10 Roll and Reach
10 Banded Pull Aparts
10 Glute Bridges
20 Single Unders`
    },
    {
      titulo: 'Skill',
      contenido: `*ON A 10:00 CLOCK*
Triple Under, Double Under, or Single Under Practice
Freedom (Advanced) - Triple Under Practice
Independence (Intermediate) - Double Unders or Crossover Singles Practice
Liberty (Beginner) - Single Under or Crossover Single Practice`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
800m Run
40 Line Facing Burpees
600m Run
30 Line Facing Burpees
400m Run
20 Line Facing Burpees
200m Run
10 Line Facing Burpees
*Time cap: 22 mins*`
    },
  ],
  viernes: [
    {
      titulo: 'Warmup',
      contenido: `*2 ROUNDS*
100m Build Run
10 Alternating Samson Lunges
10 Glute Bridges
10 Deadbugs
10 Air Squats
3 Empty Bar Muscle Cleans
3 Empty Bar Front Squats
3 Hang Squat Cleans`
    },
    {
      titulo: 'Weightlifting (Clean)',
      contenido: `1x [ 2 Hang Squat Cleans + 1 Front Squat ], RPE 7
*Every 1:30 for 9 mins.*
*All 3 reps unbroken, start light build in weight to Moderate-Heavy*`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*4 rounds for time of:*
600 m Run
10 Hang Squat Cleans, 85/57.5
*Time cap: 20 mins*`
    },
  ],
  sabado: [
    {
      titulo: 'Warmup',
      contenido: `*EMOM x 5:00*
*Minute 1:* 8 Air Squats + 8 Lunges + 8 Bootstrappers
*Minute 2:* 30 seconds of Single Unders
*Minute 3:* 30 seconds of Double Unders
*Minute 4:* 30 seconds of Crossover Singles
*Minute 5:* 30 seconds of Triple Unders
* Progress through each level until you reach the one you’re planning to use for the workout. Then, repeat that skill in the EMOM until the end of the 5 minutes.
7 minutes to build to deadlift workout weight. In between each set, perform one set of gymnastics, building towards planned workout movement. Athletes should proceed through these progressions:
-3-5 Strict Pull Ups or Ring Rows
-3-5 Kipping Pull Ups OR Jumping Pull Ups
-3-5 Bar Muscle-Ups OR Chest to Bar Pull Ups (or movement of choice)`
    },
    {
      titulo: 'Custom Metcon',
      contenido: `*For time:*
*Complete in teams of 2.*
*Complete as-*
*1 ROUND EACH*
10 Bar Muscle Ups
15 Wall-Ball Sit-Ups (20/14)
20 Triple Unders OR 40 Crossover Singles OR 60 Double Unders
3 Deadlifts (165/115)
*1 ROUND EACH*
15 Bar Muscle Ups
20 wall-ball Sit-Up (20/14)
25 Triple Unders OR 50 Crossover Singles OR 75 Double Unders
6 Deadlifts (165/115)
*1 ROUND EACH*
20 Bar Muscle Ups
25 wall-ball Sit-Up (20/14)
30 Triple Unders OR 60 Crossover Singles OR 90 Double Unders
9 Deadlifts (165/115)
*Time cap: 35 mins*`
    },
  ],
};
