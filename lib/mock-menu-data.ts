export interface MenuItem {
  plat: string;
  accompagnement: string;
  dessert: string;
}

export interface DayMenu {
  jour: string;
  date: string;
  menu: MenuItem;
}

export const weeklyMenu: DayMenu[] = [
  {
    jour: "Lundi",
    date: "13 janvier 2026",
    menu: {
      plat: "Poulet rôti",
      accompagnement: "Haricots verts et pommes de terre",
      dessert: "Yaourt nature",
    },
  },
  {
    jour: "Mardi",
    date: "14 janvier 2026",
    menu: {
      plat: "Poisson pané",
      accompagnement: "Riz pilaf et courgettes",
      dessert: "Compote de pommes",
    },
  },
  {
    jour: "Jeudi",
    date: "16 janvier 2026",
    menu: {
      plat: "Bœuf bourguignon",
      accompagnement: "Carottes et pâtes",
      dessert: "Fruit de saison",
    },
  },
  {
    jour: "Vendredi",
    date: "17 janvier 2026",
    menu: {
      plat: "Pizza maison",
      accompagnement: "Salade verte",
      dessert: "Mousse au chocolat",
    },
  },
];
