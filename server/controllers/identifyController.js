const Contact = require('../models/contact');

const identifyContact = async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    let existingContact = await Contact.findOne({ $or: [{ email }, { phoneNumber }] });
    
    if (!existingContact) {
      const newContact = new Contact({
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      });
      await newContact.save();
      return res.status(200).json({
        primaryContactId: newContact._id,
        emails: [newContact.email].filter(Boolean),
        phoneNumbers: [newContact.phoneNumber].filter(Boolean),
        secondaryContactIds: []
      });
    }
    
    if (existingContact.linkPrecedence === 'primary') {
      const secondaryContact = new Contact({
        email,
        phoneNumber,
        linkedId: existingContact._id,
        linkPrecedence: 
        'secondary'
      });
      await secondaryContact.save();
    }
    
    const allContacts = await Contact.find({
      $or: [
        { _id: existingContact._id },
        { linkedId: existingContact._id }
      ]
    });

    const primaryContact = allContacts.find(c => c.linkPrecedence === 'primary');
    const secondaryContacts = allContacts.filter(c => c.linkPrecedence === 'secondary');

    res.status(200).json({
      primaryContactId: primaryContact._id,
      emails: [...new Set(allContacts.map(c => c.email).filter(Boolean))],
      phoneNumbers: [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))],
      secondaryContactIds: secondaryContacts.map(c => c._id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { identifyContact };
