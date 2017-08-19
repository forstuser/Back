export default class DashboardAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  prepareDashboardResult(isNewUser) {
    if (!isNewUser) {
      return {
        Status: true,
        Message: 'Dashboard restore Successful',
        NotificationCount: '2',
        RecentSearches: [
          'Amazon',
          'BigBasket',
          'AirBnB',
          'Uber',
          'Ola'
        ],
        UpcomingServices: [
          {
            Id: '10',
            Type: '1',
            Title: 'Electricity Bill Payment',
            SubTitle: '819 Olin Rapid Suite 780',
            Amount: '2,500',
            DueOn: '2017-08-30 00:00:00'
          },
          {
            Id: '11',
            Type: '2',
            Title: 'Warranty expiring',
            SubTitle: 'Sony Headphones',
            Amount: '',
            DueOn: '2017-08-26 00:00:00'
          },
          {
            Id: '12',
            Type: '3',
            Title: 'Insurance expiring',
            SubTitle: 'Hero Honda CD Deluxe',
            Amount: '',
            DueOn: '2017-09-5 00:00:00'
          },
          {
            Id: '13',
            Type: '4',
            Title: 'Service scheduled',
            SubTitle: 'MacBook Pro 15” Retina',
            Amount: '',
            DueOn: '2017-09-15 00:00:00'
          }
        ],
        INSIGHT: {
          StartDate: '2017-08-08 00:00:00',
          EndDate: '2017-08-14 00:00:00',
          TotalSpend: '31400',
          TotalDays: '7',
          Day1: '5100',
          Day2: '700',
          Day3: '2500',
          Day4: '150',
          Day5: '440',
          Day6: '540',
          Day7: '21970'
        }
      };
    }

    return {
      Status: true,
      Message: 'Dashboard restore Successful'
    };
  }
}
