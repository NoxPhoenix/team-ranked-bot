const array = [1, 2, 3, 4, 5, 6];

const [one, two, three, four, five, six = 1000] = [...array];

console.log(one);
console.log(two);
console.log(three);
console.log(four);
console.log(five);
console.log(six);
