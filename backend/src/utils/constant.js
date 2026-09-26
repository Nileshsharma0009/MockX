const SelectExam = [
  {
     id: "imucet",
  name: "IMUCET",
  fullName: "IMU CET Exam",
  description: "Indian Maritime University Common Entrance Test",
  
  route: "/mock-tests/imucet",
  price: 499,
  },
  {
    id: "mht-cet",
    name: "MHT-CET",
    fullName: "MHTCET-PCM ",
    description: "Maharashtra Common Entrance Test",
    route: "/mock-tests/mht-cet",
    price: 149,
    comingSoon: true,
  },
  {
    id: "mht-cet-MBA",
    name: "MHT-CET-MBA",
    fullName: "MHTCET-MBA ",
    description: "Maharashtra Common Entrance Test",
    route: "/mock-tests/mht-cet-mba",
    price: 499,
    comingSoon: true,
  },
  {
    id: "physics",
    name: "Physics Test",
    fullName: "Physics Dynamic Practice",
    description: "25 questions | 30 minutes | +2 / -0.5 marking (Dynamic Engine Demo)",
    route: "/test?mock=custom-phy-01",
    price: 0,
  },
  {
    id: "maths",
    name: "math Test",
    fullName: "Mathematics Dynamic Practice",
    description: "25 questions | 30 minutes | +2 / -0.5 marking (Dynamic Engine Demo)",
    route: "/test?mock=demo",
    price: 0,
  },
];

export default SelectExam;
