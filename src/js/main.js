/*Блок с импортами модулей*/
import { sum } from './modules/module1'
import $ from 'jquery'
import 'slick-carousel/slick/slick.min.js' //здесь подключается скрпт карусели из папки node_modules
import 'modules/head.js'

console.log(sum(1, 5))
let a = 12
const b = 'Test'
document.body.addEventListener('click', ({target}) => {
  console.log(target)
})

//Здесь мы используем функцию запуска карусели на обёртке всех слайдов, я её добавил в _carousel.html
$('.slid-wrapper').slick()