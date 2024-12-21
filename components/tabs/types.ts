export type NoteData = { note: Midi, muted: boolean, slide: boolean, bend: string }
/*
  We're dividing an entire bar, not a beat (which would usually be 1/4 of a bar).
  A half note is considered 2 beats, but 1/2 of a bar. */
export type Division = {length: number, notes: NoteData[]}
/*
this following model doesn't support triplets, because it assumes equal time for each number:
1 1 1 1 <- four equal subdivisions (4 quarter notes)
1 2 1 1 -> dividing one of the subdivisions into two for eigth notes
2 1 1 -> half note, quarter note, quarter note
1 3 1 1 -> we can divide one of the beats into 3, but how can we divide 2/3?
We need to keep track of how many notes, and how many beats they last.
[[1,1][1,1][1,1][1,1]] <- quarter, quarter, quarter, quarter
[[1,2][1,1][1,1]] <- half, quarter, quarter. the notes sit at the left of a subbar, not in the center.
[[2,1][1,1][1,1][1,1]] the first quarter note is divided into two eigth notes
[[3,2][1,1],[1,1]] triplets! followed by two quarternotes
[[1,4]] whole note.
[[1,1][1,1][1,1]] hmm, the total number of beats in 3. So we're in 3/4.
[[1,2][1,2][1,1]]

wait did I just reinvent fractions

1 3 1 1 -> we can divide one of the beats into 3, but how can we divide 2/3?
1 1 1 1 -> 0.5 0.5 | 0.5 0.5 | 0.5 0.5 | 0.5 0.5 -> 1/3 1/3 1/3 | 0.5 0.5 | 0.5 0.5 -> 1.5 / 1 / 1

lol. we can just use an array of numbers. 
when you split, you replace it with two numbers that are half of it.
 if you want triplets, you replace it with three numbers 1/3 of it.
