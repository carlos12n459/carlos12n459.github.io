/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // --- users: add locked `role`, close public sign-up (admin-only) ---
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["member", "admin"],
        }),
      );
    }

    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.createRule = null; // closed sign-up; admin is seeded below
    users.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false) || @request.auth.role = 'admin'";
    users.deleteRule = null;
    app.save(users);

    // Seed the first admin account. The password comes from the environment,
    // never from source code. If it is not set, no admin is seeded.
    const seedPassword = $os.getenv("PB_SEED_ADMIN_PASSWORD");
    let adminExists = true;
    try {
      app.findAuthRecordByEmail("users", "admin@precioflash.app");
    } catch (_) {
      adminExists = false;
    }
    if (!adminExists && seedPassword) {
      const admin = new Record(users);
      admin.set("id", "user00000000001");
      admin.setEmail("admin@precioflash.app");
      admin.setPassword(seedPassword);
      admin.set("name", "Administrador");
      admin.set("role", "admin");
      app.save(admin);
    }

    // --- products: public-read (published), admin-write ---
    let products;
    try {
      products = app.findCollectionByNameOrId("products");
    } catch (_) {
      products = new Collection({
        type: "base",
        name: "products",
        listRule: "status = 'published' || @request.auth.role = 'admin'",
        viewRule: "status = 'published' || @request.auth.role = 'admin'",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "name", type: "text", required: true, max: 200 },
          { name: "brand", type: "text", max: 100 },
          {
            name: "category",
            type: "select",
            required: true,
            maxSelect: 1,
            values: [
              "gpu",
              "cpu",
              "desktop",
              "laptop",
              "monitor",
              "ram",
              "storage",
              "motherboard",
              "psu",
              "cooling",
              "case",
              "peripherals",
              "audio",
            ],
          },
          { name: "model", type: "text", max: 120 },
          { name: "image", type: "url" },
          { name: "description", type: "text" },
          { name: "specs", type: "json" },
          { name: "price", type: "number" },
          { name: "currency", type: "text", max: 10 },
          { name: "store", type: "text", max: 100 },
          { name: "productUrl", type: "url" },
          { name: "affiliateUrl", type: "url" },
          { name: "previousPrice", type: "number" },
          { name: "featured", type: "bool" },
          { name: "popular", type: "bool" },
          {
            name: "status",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["published", "draft"],
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(products);
    }

    // --- demo products (clearly illustrative; no invented prices) ---
    const seeds = [
      {
        id: "prod00000000001",
        name: "NVIDIA GeForce RTX 4060 8GB",
        brand: "NVIDIA",
        category: "gpu",
        model: "RTX 4060",
        image:
          "https://images.unsplash.com/photo-1682096101368-e97a285f9c72?w=1024&h=1024&fit=crop&q=80",
        description: "Tarjeta gráfica de gama media para gaming a 1080p.",
        specs: {
          vram: "8GB GDDR6",
          fabricante: "NVIDIA",
          interfaz: "PCIe 4.0",
          consumo: "115W",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=rtx+4060",
        featured: true,
        popular: true,
        status: "published",
      },
      {
        id: "prod00000000002",
        name: "AMD Ryzen 5 7600",
        brand: "AMD",
        category: "cpu",
        model: "Ryzen 5 7600",
        image:
          "https://images.unsplash.com/photo-1667250572719-d2f419e3da50?w=1024&h=1024&fit=crop&q=80",
        description: "Procesador de 6 núcleos para gaming y productividad.",
        specs: {
          socket: "AM5",
          nucleos: "6",
          hilos: "12",
          generacion: "Zen 4",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=ryzen+5+7600",
        featured: true,
        popular: false,
        status: "published",
      },
      {
        id: "prod00000000003",
        name: "PC Gaming PrecioFlash G1",
        brand: "PrecioFlash",
        category: "desktop",
        model: "G1",
        image:
          "https://images.unsplash.com/photo-1676571729804-dedf3b6d2258?w=1024&h=1024&fit=crop&q=80",
        description: "Equipo gaming preconfigurado con RGB y panel de cristal.",
        specs: {
          cpu: "Ryzen 5 7600",
          gpu: "RTX 4060",
          ram: "16GB DDR5",
          almacenamiento: "1TB NVMe",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=pc+gaming",
        featured: true,
        popular: true,
        status: "published",
      },
      {
        id: "prod00000000004",
        name: 'Monitor Gaming 27" QHD 144Hz',
        brand: "Gamer",
        category: "monitor",
        model: "G27Q",
        image:
          "https://images.unsplash.com/photo-1647779090276-29a93d4f9937?w=1024&h=1024&fit=crop&q=80",
        description: "Monitor QHD de 27 pulgadas con alta frecuencia de refresco.",
        specs: {
          resolucion: "2560x1440",
          tamano: '27"',
          frecuencia: "144Hz",
          panel: "IPS",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=monitor+gaming+27+144hz",
        featured: false,
        popular: true,
        status: "published",
      },
      {
        id: "prod00000000005",
        name: "Corsair Vengeance 32GB DDR5",
        brand: "Corsair",
        category: "ram",
        model: "CMK32GX5M2B",
        image:
          "https://images.unsplash.com/photo-1699796990049-3406a9991baa?w=1024&h=1024&fit=crop&q=80",
        description: "Kit de memoria DDR5 de alta velocidad.",
        specs: {
          capacidad: "32GB (2x16GB)",
          ddr: "DDR5",
          velocidad: "5600MHz",
          formato: "DIMM",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=corsair+vengeance+ddr5",
        featured: false,
        popular: false,
        status: "published",
      },
      {
        id: "prod00000000006",
        name: "Teclado Mecánico Gaming RGB",
        brand: "Gamer",
        category: "peripherals",
        model: "K-MECH",
        image:
          "https://images.unsplash.com/photo-1626958390898-162d3577f293?w=1024&h=1024&fit=crop&q=80",
        description: "Teclado mecánico con retroiluminación RGB.",
        specs: {
          tipo: "Mecánico",
          conectividad: "USB",
          switches: "Red",
          rgb: "Sí",
        },
        currency: "EUR",
        store: "Amazon",
        productUrl: "https://www.amazon.es/s?k=teclado+mecanico+gaming",
        featured: false,
        popular: true,
        status: "published",
      },
    ];

    for (const data of seeds) {
      try {
        app.findRecordById("products", data.id);
      } catch (_) {
        const r = new Record(products);
        r.load(data);
        app.save(r);
      }
    }
  },
  (app) => {
    for (const id of [
      "prod00000000001",
      "prod00000000002",
      "prod00000000003",
      "prod00000000004",
      "prod00000000005",
      "prod00000000006",
    ]) {
      try {
        app.delete(app.findRecordById("products", id));
      } catch (_) {
        /* already gone */
      }
    }
    try {
      app.delete(app.findCollectionByNameOrId("products"));
    } catch (_) {
      /* already gone */
    }
    try {
      app.delete(app.findAuthRecordByEmail("users", "admin@precioflash.app"));
    } catch (_) {
      /* already gone */
    }
  },
);
