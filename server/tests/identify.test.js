const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); // Import your Express app
const Contact = require("../models/contact");

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  // Clear the database after each test
  await Contact.deleteMany({});
});

afterAll(async () => {
  // Close the database connection
  await mongoose.connection.close();
});

describe("POST /identify", () => {
  test("Should create a new primary contact if no match exists", async () => {
    const response = await request(app)
      .post("/identify")
      .send({ email: "test@email.com", phoneNumber: "1234567890" });

    expect(response.status).toBe(200);
    expect(response.body.primaryContactId).toBeDefined();
    expect(response.body.emails).toContain("test@email.com");
    expect(response.body.phoneNumbers).toContain("1234567890");
    expect(response.body.secondaryContactIds).toEqual([]);
  });

  test("Should link to an existing primary contact", async () => {
    // Create an existing primary contact
    const primary = await Contact.create({
      email: "existing@email.com",
      phoneNumber: "1111111111",
      linkPrecedence: "primary",
    });

    const response = await request(app)
      .post("/identify")
      .send({ email: "new@email.com", phoneNumber: "1111111111" });

    expect(response.status).toBe(200);
    expect(response.body.primaryContactId).toBe(primary._id.toString());
    expect(response.body.emails).toEqual(expect.arrayContaining(["existing@email.com", "new@email.com"]));
    expect(response.body.phoneNumbers).toEqual(["1111111111"]);
    expect(response.body.secondaryContactIds.length).toBe(1);
  });

  test("Should return an error if no email or phone number is provided", async () => {
    const response = await request(app)
      .post("/identify")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email or phone number is required");
  });
});
